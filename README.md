# search-orm-connector-elastic

Elasticsearch 7.x Connector for search-orm

* [Filters](#filters)

## Filters

### Query Filters

```javascript
{
  "where": {},
  "limit": 100,
  "skip": 2, // offset
  "searchafter": [], // optional for pagination
  "order": [], // [] or ""
  "fields": [], // [] or ""
  "include": [], // [] or "" for relations
}
```
