const R = require('ramda');

const buildWhere = function (idName, where) {
  const self = this;

  let nestedFields = R.map((val, key) => (val.type === 'nested' ? key : null), self.dataSource.settings.mappings);
  nestedFields = R.filter((v) => v, nestedFields);

  const body = {
    query: {
      bool: {
        must: [],
        should: [],
        filter: [],
        must_not: []
      }
    }
  };

  self.buildNestedQueries(body, where, nestedFields);
  if (body && body.query && body.query.bool &&
    body.query.bool.must && body.query.bool.must.length === 0) {
    delete body.query.bool.must;
  }
  if (body && body.query && body.query.bool &&
    body.query.bool.filter && body.query.bool.filter.length === 0) {
    delete body.query.bool.filter;
  }
  if (body && body.query && body.query.bool &&
    body.query.bool.should && body.query.bool.should.length === 0) {
    delete body.query.bool.should;
  }
  if (body && body.query && body.query.bool &&
    body.query.bool.must_not && body.query.bool.must_not.length === 0) {
    delete body.query.bool.must_not;
  }
  if (body && body.query && body.query.bool && R.isEmpty(body.query.bool)) {
    delete body.query.bool;
  }

  if (body && body.query && R.isEmpty(body.query)) {
    body.query = {
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
    };
  }
  return body;
};

const buildNestedQueries = function (body, where, nestedFields) {
  const self = this;
  if (Object.keys(where).length === 0) {
    body = {
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
    return body;
  }
  const rootPath = body.query;
  self.buildDeepNestedQueries(true, where,
    body, rootPath, nestedFields);
  const docTypeQuery = R.find((v) => v.term && v.term.docType, rootPath.bool.filter);
  let addedDocTypeToRootPath = false;
  if (typeof docTypeQuery !== 'undefined') {
    addedDocTypeToRootPath = true;
    docTypeQuery.term.docType = self.modelName;
  } else {
    addedDocTypeToRootPath = true;
    rootPath.bool.filter.push({
      term: {
        docType: self.modelName
      }
    });
  }

  if (addedDocTypeToRootPath) {
    if (!!rootPath && rootPath.bool && rootPath.bool.should && rootPath.bool.should.length !== 0) {
      rootPath.bool.must.push({
        bool: {
          should: rootPath.bool.should
        }
      });
      rootPath.bool.should = [];
    }

    if (!!rootPath && rootPath.bool &&
      rootPath.bool.must_not && rootPath.bool.must_not.length !== 0) {
      rootPath.bool.must.push({
        bool: {
          must_not: rootPath.bool.must_not
        }
      });
      rootPath.bool.must_not = [];
    }
  }
  return true;
};

const buildDeepNestedQueries = function (
  isRoot,
  where,
  body,
  queryPath,
  nestedFields
) {
  const self = this;
  R.forEach((value, key) => {
    let cond = value;
    if (key === 'id' || key === self.idName) {
      key = '_id';
    }
    const splitKey = key.split('.');
    let isNestedKey = false;
    let nestedSuperKey = null;
    if (key.indexOf('.') > -1 && !!splitKey[0] && nestedFields.indexOf(splitKey[0]) > -1) {
      isNestedKey = true;
      // eslint-disable-next-line prefer-destructuring
      nestedSuperKey = splitKey[0];
    }

    if (key === 'and' && Array.isArray(value)) {
      let andPath;
      if (isRoot) {
        andPath = queryPath.bool.must;
      } else {
        const andObject = {
          bool: {
            must: []
          }
        };
        andPath = andObject.bool.must;
        queryPath.push(andObject);
      }
      cond.forEach((c) => {
        self.buildDeepNestedQueries(false, c, body, andPath, nestedFields);
      });
    } else if (key === 'or' && Array.isArray(value)) {
      let orPath;
      if (isRoot) {
        orPath = queryPath.bool.should;
      } else {
        const orObject = {
          bool: {
            should: []
          }
        };
        orPath = orObject.bool.should;
        queryPath.push(orObject);
      }
      cond.forEach((c) => {
        self.buildDeepNestedQueries(false, c, body, orPath, nestedFields);
      });
    } else {
      let spec = false;
      if (cond && cond.constructor.name === 'Object') {
        spec = Object.keys(cond)[0];
        cond = cond[spec];
      }
      if (spec) {
        if (spec === 'gte' || spec === 'gt' || spec === 'lte' || spec === 'lt') {
          let rangeQuery = {
            range: {}
          };
          const rangeQueryGuts = {};
          rangeQueryGuts[spec] = cond;
          rangeQuery.range[key] = rangeQueryGuts;

          // Additional handling for nested Objects
          if (isNestedKey) {
            rangeQuery = {
              nested: {
                path: nestedSuperKey,
                score_mode: 'max',
                query: rangeQuery
              }
            };
          }

          if (isRoot) {
            queryPath.bool.must.push(rangeQuery);
          } else {
            queryPath.push(rangeQuery);
          }
        }

        /**
         * Logic for loopback `between` filter of where
         * @example {where: {size: {between: [0,7]}}}
         */
        if (spec === 'between') {
          if (cond.length === 2 && (cond[0] <= cond[1])) {
            let betweenArray = {
              range: {}
            };
            betweenArray.range[key] = {
              gte: cond[0],
              lte: cond[1]
            };

            // Additional handling for nested Objects
            if (isNestedKey) {
              betweenArray = {
                nested: {
                  path: nestedSuperKey,
                  score_mode: 'max',
                  query: betweenArray
                }
              };
            }
            if (isRoot) {
              queryPath.bool.must.push(betweenArray);
            } else {
              queryPath.push(betweenArray);
            }
          }
        }
        /**
         * Logic for loopback `inq`(include) filter of where
         * @example {where: { property: { inq: [val1, val2, ...]}}}
         */
        if (spec === 'inq') {
          let inArray = {
            terms: {}
          };
          inArray.terms[key] = cond;
          // Additional handling for nested Objects
          if (isNestedKey) {
            inArray = {
              nested: {
                path: nestedSuperKey,
                score_mode: 'max',
                query: inArray
              }
            };
          }
          if (isRoot) {
            queryPath.bool.must.push(inArray);
          } else {
            queryPath.push(inArray);
          }
        }

        /**
         * Logic for loopback `nin`(not include) filter of where
         * @example {where: { property: { nin: [val1, val2, ...]}}}
         */
        if (spec === 'nin') {
          let notInArray = {
            terms: {}
          };
          notInArray.terms[key] = cond;
          // Additional handling for nested Objects
          if (isNestedKey) {
            notInArray = {
              nested: {
                path: nestedSuperKey,
                score_mode: 'max',
                query: {
                  bool: {
                    must: [notInArray]
                  }
                }
              }
            };
          }
          if (isRoot) {
            queryPath.bool.must_not.push(notInArray);
          } else {
            queryPath.push({
              bool: {
                must_not: [notInArray]
              }
            });
          }
        }

        /**
         * Logic for loopback `neq` (not equal) filter of where
         * @example {where: {role: {neq: 'lead' }}}
         */
        if (spec === 'neq') {
          /**
           * First - filter the documents where the given property exists
           * @type {{exists: {field: *}}}
           */
          // var missingFilter = {exists :{field : key}};
          /**
           * Second - find the document where value not equals the given value
           * @type {{term: {}}}
           */
          let notEqual = {
            term: {}
          };
          notEqual.term[key] = cond;
          /**
           * Apply the given filter in the main filter(body) and on given path
           */
          // Additional handling for nested Objects
          if (isNestedKey) {
            notEqual = {
              match: {}
            };
            notEqual.match[key] = cond;
            notEqual = {
              nested: {
                path: nestedSuperKey,
                score_mode: 'max',
                query: {
                  bool: {
                    must: [notEqual]
                  }
                }
              }
            };
          }
          if (isRoot) {
            queryPath.bool.must_not.push(notEqual);
          } else {
            queryPath.push({
              bool: {
                must_not: [notEqual]
              }
            });
          }

          // body.query.bool.must.push(missingFilter);
        }
        if (spec === 'like') {
          let likeQuery = {
            regexp: {}
          };
          likeQuery.regexp[key] = cond;

          // Additional handling for nested Objects
          if (isNestedKey) {
            likeQuery = {
              nested: {
                path: nestedSuperKey,
                score_mode: 'max',
                query: {
                  bool: {
                    must: [likeQuery]
                  }
                }
              }
            };
          }
          if (isRoot) {
            queryPath.bool.must.push(likeQuery);
          } else {
            queryPath.push(likeQuery);
          }
        }

        if (spec === 'nlike') {
          let nlikeQuery = {
            regexp: {}
          };
          nlikeQuery.regexp[key] = cond;

          // Additional handling for nested Objects
          if (isNestedKey) {
            nlikeQuery = {
              nested: {
                path: nestedSuperKey,
                score_mode: 'max',
                query: {
                  bool: {
                    must_not: [nlikeQuery]
                  }
                }
              }
            };
          }
          if (isRoot) {
            queryPath.bool.must_not.push(nlikeQuery);
          } else {
            queryPath.push({
              bool: {
                must_not: [nlikeQuery]
              }
            });
          }
        }
        // geo_shape || geo_distance || geo_bounding_box
        if (spec === 'geo_shape' || spec === 'geo_distance' || spec === 'geo_bounding_box') {
          let geoQuery = {
            filter: {}
          };
          geoQuery.filter[spec] = cond;

          if (isNestedKey) {
            geoQuery = {
              nested: {
                path: nestedSuperKey,
                score_mode: 'max',
                query: {
                  bool: geoQuery
                }
              }
            };
            if (isRoot) {
              queryPath.bool.must.push(geoQuery);
            } else {
              queryPath.push(geoQuery);
            }
          } else if (isRoot) {
            queryPath.bool.filter = geoQuery;
          } else {
            queryPath.push({
              bool: geoQuery
            });
          }
        }
      } else {
        let nestedQuery = {};
        if (typeof value === 'string') {
          value = value.trim();
          if (value.indexOf(' ') > -1) {
            nestedQuery.match_phrase = {};
            nestedQuery.match_phrase[key] = value;
          } else {
            nestedQuery.match = {};
            nestedQuery.match[key] = value;
          }
        } else {
          nestedQuery.match = {};
          nestedQuery.match[key] = value;
        }
        // Additional handling for nested Objects
        if (isNestedKey) {
          nestedQuery = {
            nested: {
              path: nestedSuperKey,
              score_mode: 'max',
              query: {
                bool: {
                  must: [nestedQuery]
                }
              }
            }
          };
        }

        if (isRoot) {
          queryPath.bool.must.push(nestedQuery);
        } else {
          queryPath.push(nestedQuery);
        }
      }
    }
  }, where);
};

exports.buildWhere = buildWhere;
exports.buildNestedQueries = buildNestedQueries;
exports.buildDeepNestedQueries = buildDeepNestedQueries;
