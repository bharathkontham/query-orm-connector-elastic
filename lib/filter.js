const R = require('ramda');

const addDefaults = function (functionName) {
  const self = this;
  const payload = {
    index: self.dataSource.settings.indexName
  };
  if (self.refreshOn.indexOf(functionName) !== -1) {
    payload.refresh = true;
  }
  return payload;
};

const buildOrder = function (idName, order) {
  const sort = [];

  let keys = order;
  if (typeof keys === 'string') {
    keys = keys.split(',');
  }
  for (let index = 0, len = keys.length; index < len; index += 1) {
    const m = keys[index].match(/\s+(A|DE)SC$/);
    let key = keys[index];
    key = key.replace(/\s+(A|DE)SC$/, '').trim();
    if (key === idName) {
      key = '_id';
    }
    const temp = {};
    if (m && m[1] === 'DE') {
      temp[key] = 'desc';
      sort.push(temp);
    } else {
      temp[key] = 'asc';
      sort.push(temp);
    }
  }

  return sort;
};

const buildFilter = function (filter = {}) {
  const self = this;

  const payload = self.addDefaults(self.modelName, 'buildFilter');
  payload.body = {};

  if (filter.limit !== undefined && filter.limit !== null) {
    payload.size = filter.limit;
  } else {
    payload.size = self.dataSource.defaultLimit;
  }
  if (filter.skip !== undefined && filter.skip !== null) {
    payload.from = filter.skip;
  }
  if (filter.fields) {
    // Elasticsearch _source filter
    if (Array.isArray(filter.fields) || typeof filter.fields === 'string') {
      payload.body._source = filter.fields;
    } else if (typeof filter.fields === 'object' && Object.keys(filter.fields).length > 0) {
      payload.body._source = {
        includes: R.map((v, k) => k, R.pickBy((v) => v === true, filter.fields)),
        excludes: R.map((v, k) => k, R.pickBy((v) => v === false, filter.fields))
      };
    }
  }
  if (filter.searchafter && Array.isArray(filter.searchafter) && filter.searchafter.length) {
    payload.body.search_after = filter.searchafter;
    payload.from = undefined;
  }
  if (filter.order) {
    payload.body.sort = self.buildOrder(self.idName, filter.order);
  } else {
    if (self.idName === 'id' && self.modelDefinition.id.generated) {
      payload.body.sort = ['_id'];
    } else {
      payload.body.sort = [self.idName]; // default sort should be based on fields marked as id
    }
  }
  if (Object.keys(filter).length === 0 ||
    !Object.prototype.hasOwnProperty.call(filter, 'where') ||
    Object.keys(filter.where).length === 0) {
    payload.body = {
      query: {
        bool: {
          must: {
            match_all: {}
          },
          filter: [{
            term: {
              docType: self.modelName
            }
          }]
        }
      }
    };
  } else if (filter.where) {
    payload.body.query = self.buildWhere(filter.where).query;
  }

  return payload;
};

exports.addDefaults = addDefaults;
exports.buildOrder = buildOrder;
exports.buildFilter = buildFilter;
