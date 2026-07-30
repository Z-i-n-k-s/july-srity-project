/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");
const Module = require("module");

function middleware(_req, _res, next) {
  if (typeof next === "function") next();
}

function makeRouter() {
  const router = function routerMiddleware(_req, _res, next) {
    if (typeof next === "function") next();
  };
  for (const method of ["use", "get", "post", "put", "patch", "delete", "options", "head"]) {
    router[method] = (...args) => {
      const handlers = args.filter((value, index) => index > 0 || typeof value !== "string");
      for (const handler of handlers) {
        if (typeof handler !== "function") {
          throw new TypeError(`Express ${method.toUpperCase()} received a non-function handler.`);
        }
      }
      return router;
    };
  }
  return router;
}

const express = () => {
  const app = makeRouter();
  app.set = () => app;
  app.disable = () => app;
  app.listen = (_port, callback) => {
    if (callback) callback();
    return { close(callbackClose) { if (callbackClose) callbackClose(); } };
  };
  return app;
};
express.Router = makeRouter;
express.json = () => middleware;
express.urlencoded = () => middleware;

class Schema {
  constructor(definition = {}, options = {}) {
    this.definition = definition;
    this.options = options;
  }
  index() { return this; }
  pre() { return this; }
  post() { return this; }
  virtual() { return { get() {}, set() {} }; }
  set() { return this; }
  path() { return { validate() { return this; } }; }
}
Schema.Types = {
  ObjectId: class ObjectId {},
  Decimal128: class Decimal128 {},
  Mixed: class Mixed {},
};

const mongoose = {
  Schema,
  models: {},
  Types: { ObjectId: Schema.Types.ObjectId, Decimal128: Schema.Types.Decimal128 },
  connection: { readyState: 0, close: async () => {} },
  model(name) {
    if (this.models[name]) return this.models[name];
    class Model {}
    for (const method of [
      "create", "find", "findOne", "findById", "findByIdAndUpdate", "findOneAndUpdate",
      "findOneAndDelete", "countDocuments", "exists", "updateOne", "updateMany", "deleteOne",
      "deleteMany", "aggregate", "startSession",
    ]) Model[method] = () => ({ select() { return this; }, populate() { return this; }, sort() { return this; }, skip() { return this; }, limit() { return this; }, session() { return this; }, then(resolve) { return Promise.resolve(null).then(resolve); } });
    this.models[name] = Model;
    return Model;
  },
  connect: async () => mongoose,
};

function multer() {
  return { single: () => middleware, array: () => middleware, fields: () => middleware, none: () => middleware };
}
multer.memoryStorage = () => ({});
multer.diskStorage = () => ({});
multer.MulterError = class MulterError extends Error {};

const stubs = {
  express,
  mongoose,
  cors: () => middleware,
  "cookie-parser": () => middleware,
  helmet: () => middleware,
  "express-rate-limit": () => middleware,
  multer,
  bcryptjs: { hash: async () => "hash", compare: async () => true },
  jsonwebtoken: { sign: () => "token", verify: () => ({ sub: "id" }) },
  cloudinary: { v2: { config() {}, uploader: { upload_stream: () => ({ end() {} }), upload(_path, _options, callback) { callback(null, { public_id: "id", secure_url: "url" }); }, upload_large(_path, _options, callback) { callback(null, { public_id: "id", secure_url: "url" }); }, destroy: async () => ({}) } } },
  nodemailer: { createTransport: () => ({ sendMail: async () => ({ messageId: "test" }) }) },
  dotenv: { config: () => ({}) },
  "swagger-jsdoc": () => ({ openapi: "3.0.3", paths: {} }),
  "swagger-ui-express": { serve: middleware, setup: () => middleware },
};

const originalLoad = Module._load;
Module._load = function patchedLoad(request, parent, isMain) {
  if (Object.prototype.hasOwnProperty.call(stubs, request)) return stubs[request];
  return originalLoad.call(this, request, parent, isMain);
};

const root = path.resolve(__dirname, "..");
const directories = ["models", "helpers", "middleware", "config", "controllers", "routes"];
const files = directories.flatMap((directory) =>
  fs.readdirSync(path.join(root, directory), { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".js"))
    .map((entry) => path.join(root, directory, entry.name))
);
files.push(path.join(root, "index.js"));

const failures = [];
for (const file of files) {
  try {
    delete require.cache[require.resolve(file)];
    require(file);
  } catch (error) {
    failures.push({ file: path.relative(root, file), message: error.stack || error.message });
  }
}

if (failures.length) {
  console.error(`Load check failed for ${failures.length} file(s):`);
  for (const failure of failures) console.error(`\n${failure.file}\n${failure.message}`);
  process.exit(1);
}

console.log(`Module load check passed for ${files.length} JavaScript modules.`);
