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

ESConnector.prototype.find = async function (filter) {
  return [];
};

ESConnector.prototype.findById = async function (id) {
  return {};
};

ESConnector.prototype.findOne = async function (filter) {
  return {};
};

ESConnector.prototype.create = async function (data) {
  return {};
};

ESConnector.prototype.updateById = async function (id, data) {
  return {};
};

ESConnector.prototype.updateByQuery = async function (where, data) {
  return [];
};

ESConnector.prototype.deleteById = async function (id, data) {
  return {
    count: 0
  };
};

ESConnector.prototype.deleteByQuery = async function (where, data) {
  return {
    count: 0
  };
};

ESConnector.prototype.count = async function (where) {
  return {
    count: 0
  };
};

module.exports = ESConnector;
