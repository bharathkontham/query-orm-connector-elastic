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

const updateById = async function (id, data) {};

const updateByQuery = async function (where, data) {};

const deleteById = async function (id) {};

const deleteByQuery = async function (where) {};

exports.create = create;
exports.updateById = updateById;
exports.updateByQuery = updateByQuery;
exports.deleteById = deleteById;
exports.deleteByQuery = deleteByQuery;
