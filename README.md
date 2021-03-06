# query-orm-connector-elastic

Elasticsearch 7.x Connector for query-orm

[![npm version](https://badge.fury.io/js/query-orm-connector-elastic.svg)](https://www.npmjs.com/package/query-orm)

* [Installation](#installation)
* [Usage](#usage)
* [Example](#example)

## Installation

```shell
npm i query-orm
npm i query-orm-connector-elastic
```

## Usage

### app.js

```javascript
const QueryORM = require('query-orm');

const app = new QueryORM({
  appRoot: DIRNAME,
  modelConfig: './model-config.json',
  dataSources: './datasource.json'
});

app.on('model-init', (data) => {
  console.log(data);
});

app.on('error', (error) => {
  console.log(error);
});

async function createUser (data) {
  const createdUser = await app.models.User.create(data);
  return createdUser;
}

createUser({
  firstname: 'Bharath',
  lastname: 'Reddy',
  username: 'bharathreddy',
  password: 'Test@1234'
}).then((createdUser) => {
  console.log(createdUser)
}).catch((error) => {
  console.log(error);
});

app.models.User.find({
  where: {
    username: 'bharathreddy'
  }
}).then((result) => {
  console.log(result)
}).catch((error) => {
  console.log(error);
});
```

### datasources.json

```json
{
  "testdatasource": {
    "name": "testdatasource",
    "settings": {
      "indexName": "testindex",
      "isAlias": false,
      "isPattern": false,
      "mappings": {
        "properties": {
          "docType": {
            "type": "keyword"
          },
          "userId": {
            "type": "keyword"
          },
          "username": {
            "type": "keyword"
          },
          "firstname": {
            "type": "keyword"
          },
          "lastname": {
            "type": "keyword"
          },
          "password": {
            "type": "keyword"
          },
          "created": {
            "type": "date"
          },
          "updated": {
            "type": "date"
          }
        }
      },
      "aliases": {},
      "indexSettings": {
        "number_of_shards": 1,
        "number_of_replicas": 2
      },
      "createIndex": true,
      "updateMapping": true,
      "version": 7,
      "defaultLimit": 200,
      "configuration": {
        "nodes": [
          "https://localhost:9200"
        ],
        "requestTimeout": 30000,
        "pingTimeout": 3000,
        "auth": {
          "username": "admin",
          "password": "admin"
        },
        "agent": {
          "maxSockets": 1,
          "keepAlive": false
        },
        "ssl": {
          "rejectUnauthorized": false
        },
        "sniffInterval": 10000
      }
    },
    "connector": "query-orm-connector-elastic",
    "localConnector": false
  }
}
```

## Example

* Checkout example [here](https://github.com/bharathkontham/tree/master/examples)
* To run example app, copy folder and npm install both **query-orm** and **query-orm-connector-elastic**
* run

```shell
node app.js
```
