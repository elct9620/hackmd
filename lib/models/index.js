"use strict";

// external modules
var fs = require("fs");
var path = require("path");
var Sequelize = require("sequelize");

// core
var config = require('../config.js');
var logger = require("../logger.js");

var dbconfig = config.db;
dbconfig.logging = config.debug ? logger.info : false;

var sequelize = null;

// Heroku specific
if (config.dburl)
    sequelize = new Sequelize(config.dburl, dbconfig);
else
    sequelize = new Sequelize(dbconfig.database, dbconfig.username, dbconfig.password, dbconfig);

// [Postgres] Handling NULL bytes
// https://github.com/sequelize/sequelize/issues/6485
function stripNullByte(value) {
    return value ? value.replace(/\u0000/g, "") : value;
}
sequelize.stripNullByte = stripNullByte;

function processData(data, _default, process) {
    if (data === undefined) return data;
    else return data === null ? _default : (process ? process(data) : data);
}
sequelize.processData = processData;

var db = {};

fs
    .readdirSync(__dirname)
    .filter(function (file) {
        return (file.indexOf(".") !== 0) && (file !== "index.js");
    })
    .forEach(function (file) {
        var model = sequelize.import(path.join(__dirname, file));
        db[model.name] = model;
    });

Object.keys(db).forEach(function (modelName) {
    if ("associate" in db[modelName]) {
        db[modelName].associate(db);
    }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
