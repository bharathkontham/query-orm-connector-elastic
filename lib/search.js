const R = require('ramda');

const find = async function (filter) {
  const self = this;
  const {
    body: result
  } = await self.db.search(self.buildFilter(filter));
  return R.map((doc) => self.docToModel(doc, result.hits.total, doc.sort), result.hits.hits);
};

const findOne = async function (filter = {}) {
  const self = this;
  filter.limit = 1;
  const {
    body: result
  } = await self.db.search(self.buildFilter(filter));
  // return self.docToModel(doc, result.hits.total, doc.sort), result.hits.hits;
  if (result.hits.total) {
    const doc = result.hits.hits[0];
    return self.docToModel(doc, result.hits.total, doc.sort);
  }
  throw new Error('Not found documents matching the query');
};

const findById = async function (id) {
  try {
    if (!id) {
      throw new Error('id argument is missing');
    }
    const self = this;
    const payload = self.addDefaults();
    payload.id = id;
    const {
      body: result
    } = await self.db.get(payload);
    return self.docToModel(result);
  } catch (error) {
    if (error.meta.body.found === false) {
      throw new Error('document with given id not found');
    }
    throw error;
  }
};

const count = async function (where = {}) {
  const self = this;
  const payload = self.addDefaults();
  payload.body = {
    query: self.buildWhere(where).query
  };
  const {
    body: result
  } = await self.db.count(payload);
  return {
    count: result.count
  };
};

exports.find = find;
exports.findOne = findOne;
exports.findById = findById;
exports.count = count;
