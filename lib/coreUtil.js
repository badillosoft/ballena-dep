module.exports = {
    moment(date) {
        const now = new Date(date || new Date());

        const utcDiff = process.env.UTC || "-5";

        const utc = new Date(date || new Date());
        utc.setHours(utc.getHours() + Number(utcDiff));

        return [
            utc.toISOString(),
            utc.toISOString().slice(0, 10),
            utc.toISOString().slice(11, 19),
            now.toISOString(),
            now.toISOString().slice(0, 10),
            now.toISOString().slice(11, 19),
        ];
    }
};