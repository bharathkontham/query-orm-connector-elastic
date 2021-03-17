const {
  Client
} = require('es7');

class ESConnector {
  constructor (modelDefinition, dataSource) {
    this.modelDefinition = modelDefinition;
    this.dataSource = dataSource;
    this.db = null;
    this.init();
  }
}

ESConnector.prototype.init = async function () {
  this.db = new Client(this.dataSource.settings.configuration);
};

module.exports = ESConnector;
