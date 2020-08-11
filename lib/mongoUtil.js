const mongodb = require("mongodb");

const { moment } = require("./coreUtil");

const { MongoClient } = mongodb;

const docs = {
    mongodb: {
        type: "package",
        "url": "https://www.npmjs.com/package/mongodb",
        "command": "npm install --save mongodb",
        "example": "const mongodb = require('mongodb');"
    }
};

const self = {
    docs,
    client: null,
    db: null,
    async mongoConnection(uri) {
        console.log("ballena/mongoUtil: Mongo connect", uri);

        self.client = await MongoClient.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        return self.client;
    },
    async mongoExecute($collection, statement) {
        let collection = $collection;

        if (!collection || typeof collection === "string") {
            if (!self.client) {
                const mongo_uri = process.env.MONGO_URI || "mongodb://localhost";
                await self.mongoConnection(mongo_uri);
            }
            if (!self.db) {
                const mongo_db = process.env.MONGO_DB || "ballena";
                self.db = self.client.db(mongo_db);
            }

            collection = self.db.collection(collection);
        }

        const mapDocument = document => (
            { id: document._id, ...document, _id: undefined }
        );

        if (statement.statement === "queryOne") {
            const { query, ...options } = statement.options;

            const document = await collection.findOne(query, options);

            if (!document) {
                if (statement.safe) return null;
                throw new Error(`ballena/mongoUtil.mongoExecute Error: Document does not exists`);
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
        return await self.mongoExecute(collection, {
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
        return await self.mongoExecute(collection, {
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
        return await self.mongoQueryOne(collection, { _id });
    },
    async mongoId(prefix, digits = 3) {
        const version = (await self.mongoQueryId("ballena.versions", prefix).catch(() => null)) || { _id: prefix };

        version.count = (version.count || 0) + 1;

        const v = `${version.count}`;

        const diff = (digits || 3) - v.length;

        const fixVersion = diff > 0 ? `${`0`.repeat(diff)}${v}` : v;

        const id = `${prefix}-${fixVersion}`;

        version.lastId = id;

        // console.log(version);

        await self.mongoUpsertOne("ballena.versions", null, version);

        return id;
    },
    async mongoInsertOne(collection, id, document) {
        document._id = id || document._id || document.id;
        delete document.id;

        if (!document._id) throw new Error(`ballena/mongoUtil.mongoInsertOne Error: Document id is not valid`);

        const [
            createAt,
            createAtDate,
            createAtTime,
            createAtISO,
            createAtISODate,
            createAtISOTime,
        ] = await moment();

        const _document = {
            ...document,
            createAtISO,
            createAtISODate,
            createAtISOTime,
            createAt,
            createAtDate,
            createAtTime,
        };

        await self.mongoExecute(collection, {
            statement: "bulkWrite",
            operations: [
                {
                    insertOne: _document
                }
            ],
            output: "document"
        });

        return await self.mongoQueryId(collection, _document._id);
    },
    async mongoUpdateOne(collection, id, document) {
        document._id = id || document._id || document.id;
        delete document.id;

        if (!document._id) throw new Error(`ballena/mongoUtil.mongoUpdateOne Error: Document id is not valid`);

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

        await self.mongoExecute(collection, {
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

        return await self.mongoQueryId(collection, _document._id);
    },
    async mongoUpsertOne(collection, id, document) {
        document._id = id || document._id || document.id;
        delete document.id;

        if (!document._id) throw new Error(`ballena/mongoUtil.mongoUpsertOne Error: Document id is not valid`);

        const [
            modifyAt,
            modifyAtDate,
            modifyAtTime,
            modifyAtISO,
            modifyAtISODate,
            modifyAtISOTime,
        ] = await moment();

        const _document = {
            ...document,
            modifyAtISODate,
            modifyAtISOTime,
            modifyAtISO,
            modifyAt,
            modifyAtDate,
            modifyAtTime,
        };

        await self.mongoExecute(collection, {
            statement: "bulkWrite",
            operations: [
                {
                    updateOne: {
                        filter: { _id: _document._id },
                        update: {
                            $set: _document
                        },
                        upsert: true
                    }
                }
            ]
        });

        return await self.mongoQueryId(collection, _document._id);
    }
};

module.exports = self;