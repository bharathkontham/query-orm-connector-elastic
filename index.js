const {
  Client
} = require('es7');
const {
  addDefaults,
  buildOrder,
  buildFilter
} = require('./lib/filter');

const {
  buildWhere,
  buildNestedQueries,
  buildDeepNestedQueries
} = require('./lib/where');

const {
  setup
} = require('./lib/setup');

const {
  find,
  findOne,
  findById,
  count
} = require('./lib/search');

const {
  create,
  updateById,
  updateByQuery,
  deleteById,
  deleteByQuery
} = require('./lib/write');

class ESConnector {
  constructor (modelDefinition, dataSource) {
    this.modelDefinition = modelDefinition;
    this.dataSource = dataSource;
    this.db = null;
    this.refreshOn = [
      'create',
      'updateById',
      'deleteById',
      'updateByQuery',
      'deleteByQuery'
    ];
    this.restAsInt = [
      'find',
      'findOne',
      'findById'
    ];
    if (this.modelDefinition.id === undefined ||
      this.modelDefinition.id.property === undefined ||
      this.modelDefinition.id.property === null) {
      throw new Error('id field not set for model!');
    }

    this.modelName = this.modelDefinition.name;
    this.idName = this.modelDefinition.id.property;
  }
}

ESConnector.prototype.setup = setup;

ESConnector.prototype.init = async function () {
  this.db = new Client(this.dataSource.settings.configuration);
  await this.db.info();
  return await this.setup();
};

ESConnector.prototype.addDefaults = addDefaults;
ESConnector.prototype.buildOrder = buildOrder;
ESConnector.prototype.buildFilter = buildFilter;
ESConnector.prototype.buildWhere = buildWhere;
ESConnector.prototype.buildNestedQueries = buildNestedQueries;
ESConnector.prototype.buildDeepNestedQueries = buildDeepNestedQueries;

ESConnector.prototype.find = find;
ESConnector.prototype.findById = findById;
ESConnector.prototype.findOne = findOne;
ESConnector.prototype.count = count;

ESConnector.prototype.create = create;
ESConnector.prototype.updateById = updateById;
ESConnector.prototype.updateByQuery = updateByQuery;
ESConnector.prototype.deleteById = deleteById;
ESConnector.prototype.deleteByQuery = deleteByQuery;

ESConnector.prototype.docToModel = function (doc, total = null, sort = null) {
  const modelDoc = doc._source;
  if (total) {
    modelDoc._total = total;
  }
  if (sort) {
    modelDoc._search_after = sort;
  }
  return modelDoc;
};

module.exports = ESConnector;
