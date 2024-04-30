const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
require(`dotenv`).config();
const options = require('./knexfile.js');
const knex = require('knex')(options);
const swaggerUI = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');
const countriesRouter = require('./routes/country');
const volcanoIDRouter = require('./routes/volcano');
const volcanoesListRouter = require('./routes/volcanoes');
const userRouter = require("./routes/user");
const adminRouter = require('./routes/admin');
const req = require('express/lib/request');

var app = express();

//Changes knex request to req.db.
app.use((req, res, next) => {
 req.db = knex
 next()
})

app.use(cors());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//Swagger docs. From slack.
app.use("/", swaggerUI.serve);
app.get(
  "/",
  swaggerUI.setup(swaggerDocument, {
    swaggerOptions: { defaultModelsExpandDepth: -1 }, // Hide schema section
  })
);

//Intialises knex.
app.get('/knex', function(req,res,next) {
  req.db.raw("SELECT VERSION()").then(
  (version) => console.log((version[0][0]))
  ).catch((err) => { console.log( err); throw err })
  res.send("Version Logged successfully");
});

//Routes.
app.use('/countries', countriesRouter);
app.use('/volcano', volcanoIDRouter);
app.use('/volcanoes', volcanoesListRouter);
app.use('/user',userRouter);
app.use('/me', adminRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;