const { moment } = require("./coreUtil");

const docs = {
    mongodb: {
        type: "package",
        "url": "https://www.npmjs.com/package/mongodb",
        "command": "npm install --save mongodb",
        "example": "const mongodb = require('mongodb');"
    }
};

module.exports = {
    docs,
    mongodb: null,
    client: null,
    db: null,
    active(mongodb) {
        this.mongodb = mongodb;
    },
    async mongoConnection(uri) {
        if (!this.mongodb) throw new Error(`ballena/mongoUtil: library is not active`);

        const { MongoClient } = this.mongodb;

        const [uri] = await input();

        console.log("ballena/mongoUtil: mongo connect", uri);

        this.client = await MongoClient.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        return this.client;
    },
    mongoDb(name) {
        this.db = this.client.db(name);
        return this.db;
    },
    async mongoExecute($collection, statement) {
        let collection = $collection;

        if (!collection || typeof collection === "string") {
            if (!this.client) {
                const mongo_uri = process.env.MONGO_URI || "mongodb://localhost";
                await mongoConnection(mongo_uri);
            }
            if (!this.db) {
                const mongo_db = process.env.MONGO_DB || "ballena";
                this.mongoDb(mongo_db);
            }

            collection = this.db.collection(collection);
        }

        const mapDocument = document => (
            { id: document._id, ...document, _id: undefined }
        );

        if (statement.statement === "queryOne") {
            const { query, ...options } = statement.options;

            const document = await collection.findOne(query, options);

            if (!document) {
                if (statement.safe) return null;
                throw new Error(`MongoQueryError: document does not exists; ${JSON.stringify(statement)}`);
            }

            return mapDocument(document);
        }

        if (statement.statement === "query") {
            const { query, ...options } = statement.options;

            const documents = await collection.find(query, options).toArray();

            return documents.map(mapDocument);
        }

        if (statement.statement === "bulkWrite") {
            const result = await collection.bulkWrite(statement.operations, statement.options);

            if (!result.ok) throw new Error(result.writeConcernErrors[0]);

            return result;
        }
    },
    async mongoQuery(collection, query, sort, limit, page, projection) {
        return await this.mongoExecute(collection, {
            statement: "query",
            options: {
                query,
                sort,
                limit,
                skip: (limit || 500) * (page || 0),
                projection
            }
        });
    },
    async mongoQueryOne(collection, query, sort, limit, page, projection) {
        return await this.mongoExecute(collection, {
            statement: "queryOne",
            options: {
                query,
                sort,
                limit,
                skip: (limit || 500) * (page || 0),
                projection
            }
        });
    },
    async mongoQueryId(collection, _id) {
        return await this.mongoQueryOne(collection, { _id });
    },
    async mongoUpdateOne(collection, id, document) {
        document._id = id || document._id || document.id;
        delete document.id;

        if (!document._id) throw new Error(`MongoUpdateOneError: id is not valid`);

        const [
            updateAt,
            updateAtDate,
            updateAtTime,
            updateAtISO,
            updateAtISODate,
            updateAtISOTime,
        ] = await moment();

        const _document = {
            ...document,
            updateAtISODate,
            updateAtISOTime,
            updateAtISO,
            updateAt,
            updateAtDate,
            updateAtTime,
        };

        await this.mongoExecute(collection, {
            statement: "bulkWrite",
            operations: [
                {
                    updateOne: {
                        filter: { _id: _document._id },
                        update: {
                            $set: _document
                        }
                    }
                }
            ]
        });

        return await mongoQueryId(collection, _document._id);
    },
};