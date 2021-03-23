const ORM = require('query-orm');
const DIRNAME = __dirname;

const app = new ORM({
  appRoot: DIRNAME,
  modelConfig: './model-config.json',
  dataSources: './datasource.json'
});
app.on('model-init', (d) => {
  console.log(d);
  console.log(d.model);
  if (d.model === 'User') {
    app.models.User.findById('asdasd').then((v) => {
      console.log(v);
    }).catch((e) => {
      console.log(e);
    });
  }
});

app.on('error', (e) => {
  console.log('error', e);
});
