const R = require('ramda');

const create = async function (data) {
  const self = this;
  const payload = self.addDefaults('create');
  payload.body = data;
  payload.body.docType = self.modelName;
  let method = 'index';
  if (!self.modelDefinition.id.generated) {
    if (!payload.body[self.idName]) {
      throw new Error(`id field '${self.idName}' value is not set!`);
    }
    method = 'create';
    payload.id = payload.body[self.idName];
  }
  const { body: result } = await self.db[method](payload);
  if (self.modelDefinition.id.generated) {
    await self.db.updateByQuery(R.merge(self.addDefaults('updateByQuery'), {
      body: {
        query: {
          bool: {
            filter: {
              term: {
                _id: result._id
              }
            }
          }
        },
        script: {
          source: `ctx._source.${self.idName} = ctx._id;`,
          lang: 'painless'
        }
      }
    }));
  }
  const {
    body: readResult
  } = await self.db.get(R.merge(self.addDefaults(), {
    id: result._id
  }));
  return self.docToModel(readResult);
};

const updateById = async function (id, data = {}) {
  if (!id) {
    throw new Error('id argument is missing');
  }
  if (!data || R.isEmpty(data)) {
    throw new Error('Invalid data');
  }
  const self = this;
  const payload = self.addDefaults('updateById');
  payload.body = {
    query: self.buildWhere({
      _id: id
    }).query,
    script: {
      lang: 'painless',
      source: '',
      params: {}
    }
  };

  R.forEachObjIndexed((value, key) => {
    if (key !== '_id' && key !== self.idName && key !== '_search_after' && key !== '_total') {
      payload.body.script.source += `ctx._source.${key}=params.${key};`;
      payload.body.script.params[key] = value;
      if (key === 'docType') {
        payload.body.script.params[key] = self.modelName;
      }
    }
  }, data);
  const {
    body: result
  } = await self.db.updateByQuery(payload);
  if (!result.updated) {
    throw new Error('Failed to update document!');
  }
  return await self.findById(id);
};

const updateByQuery = async function (where = {}, data = {}) {
  if (!data || R.isEmpty(data)) {
    throw new Error('Invalid data');
  }
  const self = this;
  const payload = self.addDefaults('updateById');
  payload.body = {
    query: self.buildWhere(where).query,
    script: {
      lang: 'painless',
      source: '',
      params: {}
    }
  };

  R.forEachObjIndexed((value, key) => {
    if (key !== '_id' && key !== self.idName && key !== '_search_after' && key !== '_total') {
      payload.body.script.source += `ctx._source.${key}=params.${key};`;
      payload.body.script.params[key] = value;
      if (key === 'docType') {
        payload.body.script.params[key] = self.modelName;
      }
    }
  }, data);
  const {
    body: result
  } = await self.db.updateByQuery(payload);
  if (!result.updated) {
    return [];
  }
  return await self.find({
    where
  });
};

const deleteById = async function (id) {};

const deleteByQuery = async function (where) {};

exports.create = create;
exports.updateById = updateById;
exports.updateByQuery = updateByQuery;
exports.deleteById = deleteById;
exports.deleteByQuery = deleteByQuery;
