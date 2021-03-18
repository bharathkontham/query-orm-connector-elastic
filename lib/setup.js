const setup = async function () {
  const self = this;
  if (self.dataSource.settings.isAlias) {
    const {
      body: res
    } = await self.db.indices.existsAlias({
      name: self.dataSource.settings.indexName
    });
    if (!res) {
      throw new Error(`Elasticsearch alias ${self.dataSource.settings.indexName} is not found`);
    }
    return true;
  }

  if (!self.dataSource.settings.isAlias) {
    const {
      body: exists
    } = await self.db.indices.exists({
      index: self.dataSource.settings.indexName
    });
    if (!exists && !self.dataSource.settings.createIndex) {
      throw new Error(`Elasticsearch index ${self.dataSource.settings.indexName} is not found`);
    }
    if (!exists && self.dataSource.settings.createIndex) {
      const {
        body: result
      } = await self.db.indices.create({
        index: self.dataSource.settings.indexName,
        body: {
          aliases: self.dataSource.settings.aliases || {},
          settings: self.dataSource.settings.indexSettings || {},
          mappings: self.dataSource.settings.mappings || {}
        }
      });
      if (!result) {
        throw new Error(`Elasticsearch index ${self.dataSource.settings.indexName} creation failed`);
      }
      return true;
    }

    if (exists && self.dataSource.settings.updateMapping) {
      const {
        body: result
      } = await self.db.indices.putMapping({
        index: self.dataSource.settings.indexName,
        body: self.dataSource.settings.mappings || {}
      });
      if (!result) {
        throw new Error(`Elasticsearch index ${self.dataSource.settings.indexName} mapping update failed`);
      }
      return true;
    }
    return true;
  }

  return true;
};

exports.setup = setup;
