(window.webpackJsonp=window.webpackJsonp||[]).push([[1],{"+diW":function(t,e,o){"use strict";o.d(e,"a",function(){return w});var n=o("mrSG"),i=o("S6qK"),c=o("90xe"),s=o("Re7d"),r=o("A8VM"),a=o("g0lL"),l=o("UDat"),d=o("wnDG"),u=o("m1nw"),h=o("Jcva"),b=o("AzR3"),p=o("uugc"),f=o("Lj5c");const m={name:"ngx",adapter:"idb",multiInstance:!1,ignoreDuplicate:!0,pouchSettings:{skip_setup:!0,ajax:{withCredentials:!1,cache:!1,timeout:1e4,headers:{}}}},v=t=>0===t?2e3:3*t;var O,j,y=o("eBm/"),g=o("fXoL");Object(i.a)(o("ezGW")),Object(i.a)(o("Wh65")),Object(i.a)(p.a),Object(i.a)(u.a),Object(i.a)(l.a),Object(i.a)(r.a),Object(i.a)(d.a),Object(i.a)(h.a),Object(i.a)(b.a),(null===(j=null===(O=window.process)||void 0===O?void 0:O.env)||void 0===j?void 0:j.TEST)&&Object(y.c)("dev or test mode");let w=(()=>{class t{constructor(){this._imported=window.localStorage._ngx_rxdb_imported}static mergeConfig(t){return Object.assign({},m,t)}static getCouchAuthProxyHeaders(t="",e=[],o=""){return{"X-Auth-CouchDB-UserName":t,"X-Auth-CouchDB-Roles":e.join(","),"X-Auth-CouchDB-Token":o}}get db(){return this.dbInstance}get collections(){return this.db.collections}get _imported(){return window.localStorage._ngx_rxdb_imported}set _imported(t){window.localStorage._ngx_rxdb_imported=t}destroyDb(){return Object(n.a)(this,void 0,void 0,function*(){try{yield this.dbInstance.remove(),yield this.dbInstance.destroy(),this.dbInstance=null}catch(t){}})}initDb(e){var o,i,s,r;return Object(n.a)(this,void 0,void 0,function*(){try{const n=t.mergeConfig(e),r=yield Object(c.b)(n);if(this.dbInstance=r,Object(y.c)("created database"),Object(y.b)(null===(o=n.options)||void 0===o?void 0:o.schemas)||(yield this.initCollections(n.options.schemas)),null===(i=n.options)||void 0===i?void 0:i.dumpPath){const t=yield(yield fetch(n.options.dumpPath)).json();this._imported&&this._imported===(null===(s=t.timestamp)||void 0===s?void 0:s.toString())||(yield this.importDbDump(t))}}catch(n){throw new y.a(null!==(r=n.message)&&void 0!==r?r:n)}})}initCollections(t){var e;return Object(n.a)(this,void 0,void 0,function*(){try{const e=yield this.prepareCollections(t),o=yield this.dbInstance.addCollections(e);Object(y.c)(`created ${Object.keys(o).length} collections bulk, `,Object.keys(o))}catch(o){throw new y.a(null!==(e=o.message)&&void 0!==e?e:o)}})}initCollection(t){var e,o;return Object(n.a)(this,void 0,void 0,function*(){let n=this.getCollection(t.name);if(Object(s.c)(n))return(null===(e=t.options)||void 0===e?void 0:e.recreate)&&(yield n.remove()),Object(y.c)("collection",n.name,"exists, skip create"),n;const i=yield this.prepareCollections({[t.name]:t});if(n=(yield this.dbInstance.addCollections(i))[t.name],Object(y.c)(`created collection "${n.name}"`),null===(o=t.options)||void 0===o?void 0:o.initialDocs){const e=yield n.info(),o=yield n.countAllDocuments();if(!o&&e.update_seq<=1){Object(y.c)(`collection "${n.name}" has "${parseInt(o,0)}" docs`);const e=new f.b({name:n.name,schemaHash:n.schema.hash,docs:t.options.initialDocs});yield n.importDump(e),Object(y.c)(`imported ${t.options.initialDocs.length} docs for collection "${n.name}"`)}}return n})}getCollection(t){const e=this.db[t];return Object(s.c)(e)?e:(Object(y.c)(`returned false for RxDB.isRxCollection(${t})`),null)}syncCollection(t,e="db",o){var n,i;if(null===(i=null===(n=t.options)||void 0===n?void 0:n.syncOptions)||void 0===i?void 0:i.remote){const{syncOptions:n}=t.options;return n.remote=n.remote.concat("/",e),n.options=Object.assign({back_off_function:v},this.db.pouchSettings.ajax,t.pouchSettings.ajax,n.options),o&&(n.options.headers=Object.assign({},n.options.headers,o)),n.queryObj&&(n.query=t.find(n.queryObj)),t.sync(n)}}syncAllCollections(t="db",e){if(Object(y.b)(this.collections))throw new y.a("collections must be initialized before importing dump");const o=[];return Object.values(this.collections).filter(t=>"remote"in t.options.syncOptions).forEach(n=>{const i=this.syncCollection(n,t,e);o.push(i)}),Object(y.c)("syncAllCollections = ",o),o}importDbDump(t){var e;return Object(n.a)(this,void 0,void 0,function*(){try{yield this.db.importDump(this.prepareDbDump(t)),this._imported=t.timestamp}catch(o){if(409!==o.status)throw new y.a(null!==(e=o.message)&&void 0!==e?e:o);this._imported=t.timestamp}})}prepareCollections(t){var e;return Object(n.a)(this,void 0,void 0,function*(){try{const e={},o=Object.values(t);for(const t of o)!t.schema&&t.options.schemaUrl&&(t.schema=yield f.a.fetchSchema(t.options.schemaUrl)),Object(a.a)(t.schema),e[t.name]=new f.a(t);return e}catch(o){throw new y.a(null!==(e=o.message)&&void 0!==e?e:o)}})}prepareDbDump(t){const e=new f.c(t);if(Object(y.b)(this.collections))throw new y.a("collections must be initialized before importing");for(const o of e.collections){const t=this.getCollection(o.name);if(!t)throw new y.a("no such collection as provided in dump");o.schemaHash=t.schema._hash}return e}}return t.\u0275fac=function(e){return new(e||t)},t.\u0275prov=g.Cb({token:t,factory:t.\u0275fac}),t})()},"0awm":function(t,e,o){"use strict";o.d(e,"a",function(){return i}),o.d(e,"b",function(){return c});var n=o("fXoL");const i=new n.q("NgxRxdbConfig"),c=new n.q("NgxRxdbCollectionConfig")},1:function(t,e,o){t.exports=o("Hasg")},2:function(t,e){},3:function(t,e){},4:function(t,e){},Hasg:function(t,e,o){"use strict";o.r(e);var n=o("fXoL");process,process,Boolean(process.env.COUCHDB_SYNC_LIVE),Boolean(process.env.COUCHDB_SYNC_HEARTBEAT);var i=o("jhN1"),c=o("tyNb"),s=o("ORsI");let r=(()=>{class t{}return t.\u0275fac=function(e){return new(e||t)},t.\u0275cmp=n.Ab({type:t,selectors:[["demo-root"]],decls:2,vars:0,template:function(t,e){1&t&&(n.Lb(0,"main"),n.Hb(1,"router-outlet"),n.Kb())},directives:[c.b],styles:["[_nghost-%COMP%] {\n        display: block;\n        font: 14px 'Helvetica Neue', Helvetica, Arial, sans-serif;\n        line-height: 1.4em;\n        background: #f5f5f5;\n        color: #4d4d4d;\n        min-width: 230px;\n        max-width: 550px;\n        margin: 0 auto;\n        -webkit-font-smoothing: antialiased;\n        -moz-osx-font-smoothing: grayscale;\n        font-weight: 300;\n      }\n\n      .flex[_ngcontent-%COMP%] {\n        display: flex;\n        align-items: center;\n        justify-content: center;\n      }"]}),t})();o("eiuk");const a={name:"demo",adapter:"idb",multiInstance:!0,options:{}},l=[{path:"todos",loadChildren:()=>o.e(6).then(o.bind(null,"9FVm")).then(t=>t.TodosModule)},{path:"",redirectTo:"todos",pathMatch:"full"}];let d=(()=>{class t{}return t.\u0275mod=n.Eb({type:t,bootstrap:[r]}),t.\u0275inj=n.Db({factory:function(e){return new(e||t)},providers:[],imports:[[i.a,c.a.forRoot(l),s.b.forRoot(a)]]}),t})();Object(n.R)(),i.b().bootstrapModule(d).catch(t=>console.error(t))},Lj5c:function(t,e,o){"use strict";o.d(e,"a",function(){return s}),o.d(e,"c",function(){return r}),o.d(e,"b",function(){return a});var n=o("mrSG");const i={},c={info:function(){return Object(n.a)(this,void 0,void 0,function*(){return yield this.pouch.info()})},countAllDocuments:function(){return Object(n.a)(this,void 0,void 0,function*(){return(yield this.pouch.allDocs({include_docs:!1,attachments:!1,deleted:"ok",startkey:"_design\uffff"})).rows.length})}};class s{constructor(t,e){Object.assign(this,Object.assign(Object.assign({},t),{pouchSettings:Object.assign(Object.assign({},e),t.pouchSettings),methods:Object.assign(Object.assign({},i),t.methods),statics:Object.assign(Object.assign({},c),t.statics)}))}static fetchSchema(t){return Object(n.a)(this,void 0,void 0,function*(){return yield(yield fetch(t)).json()})}}class r{constructor(t){this.name="ngx-rxdb-dump",this.encrypted=!1,this.passwordHash=null,Object.assign(this,t)}}class a{constructor(t){this.encrypted=!1,this.passwordHash=null,Object.assign(this,t)}}},"LvJ/":function(t,e){function o(t){return Promise.resolve().then(function(){var e=new Error("Cannot find module '"+t+"'");throw e.code="MODULE_NOT_FOUND",e})}o.keys=function(){return[]},o.resolve=o,t.exports=o,o.id="LvJ/"},ORsI:function(t,e,o){"use strict";o.d(e,"a",function(){return n.a}),o.d(e,"b",function(){return i.a}),o("Ru/n"),o("0awm"),o("+diW");var n=o("pyNe"),i=(o("Lj5c"),o("eiuk"))},"Ru/n":function(t,e,o){"use strict";o.d(e,"a",function(){return c});var n=o("ofXK"),i=o("fXoL");let c=(()=>{class t extends n.b{}return t.\u0275fac=function(e){return s(e||t)},t.\u0275pipe=i.Fb({name:"asyncNoZone",type:t,pure:!1}),t})();const s=i.Nb(c);c.prototype._updateLatestValue=function(t,e){t===this._obj&&(this._latestValue=e,this._ref.detectChanges())}},"eBm/":function(t,e,o){"use strict";function n(t,e=!1){return null==t||!t||!Object.keys(t).length||!!e&&Object.values(t).every(t=>null===t||!t)}function i(){}function c(...t){var e,o;(null===(o=null===(e=window.process)||void 0===e?void 0:e.env)||void 0===o?void 0:o.DEBUG)&&console.log.call(console,"%c[DEBUG:: NgxRxdb::]","background: #8d2089; color: #fff; padding: 2px; font-size: normal;",...t)}o.d(e,"b",function(){return n}),o.d(e,"d",function(){return i}),o.d(e,"c",function(){return c}),o.d(e,"a",function(){return s});class s extends Error{constructor(t,e){super(t),this.extra=e,this.name=this.constructor.name,Object.setPrototypeOf(this,s.prototype)}}},eiuk:function(t,e,o){"use strict";o.d(e,"a",function(){return u});var n=o("mrSG"),i=o("fXoL"),c=o("Cfvw"),s=o("pyNe"),r=o("+diW"),a=o("0awm"),l=o("eBm/");function d(t,e){return()=>Object(n.a)(this,void 0,void 0,function*(){yield t.initDb(e)})}let u=(()=>{class t{constructor(t,e,o,n,i){if(!o&&!e)throw new Error(a.a.toString()+" is not provided. Make sure you call the 'forRoot' method of the NgxRxdbModule in the AppModule only.");if(o&&e)throw new Error(a.a.toString()+" is already provided. Make sure you call the 'forRoot' method of the NgxRxdbModule in the AppModule only.");o&&!e&&Object(c.a)(t.donePromise).subscribe(()=>{})}static forFeature(t){return{ngModule:h,providers:[{provide:a.b,useValue:t},s.a]}}static forRoot(e){return{ngModule:t,providers:[{provide:a.a,useValue:e},r.a,{provide:i.d,useFactory:d,deps:[r.a,a.a],multi:!0}]}}}return t.\u0275mod=i.Eb({type:t}),t.\u0275inj=i.Db({factory:function(e){return new(e||t)(i.Pb(i.e),i.Pb(a.a,12),i.Pb(a.a,10),i.Pb(a.b,12),i.Pb(r.a,2))}}),t})(),h=(()=>{class t{constructor(t){this.collectionService=t,this.collectionService.collectionLoaded$().subscribe(l.d)}}return t.\u0275mod=i.Eb({type:t}),t.\u0275inj=i.Db({factory:function(e){return new(e||t)(i.Pb(s.a))}}),t})()},pyNe:function(t,e,o){"use strict";o.d(e,"a",function(){return p});var n=o("mrSG"),i=o("Re7d"),c=o("jtHE"),s=o("Cfvw"),r=o("NXyV"),a=o("eIep"),l=o("lJxs"),d=o("Lj5c"),u=o("+diW"),h=o("0awm"),b=o("fXoL");let p=(()=>{class t{constructor(t,e){this.dbService=t,this.config=e}get collection(){return this._collection}get db(){return this.dbService.db}ngOnDestroy(){return Object(n.a)(this,void 0,void 0,function*(){Object(i.c)(this.collection)&&(yield this.collection.destroy())})}collectionLoaded$(){return this.inited$||(this.inited$=new c.a,this.dbService.initCollection(this.config).then(t=>{this._collection=t,this.inited$.next(!0),this.inited$.complete()})),this.inited$.asObservable()}sync(t="db",e){return this.dbService.syncCollection(this.collection,t,e)}import(t){return this.collectionLoaded$().pipe(Object(a.a)(()=>{const e=new d.b({name:this.collection.name,schemaHash:this.collection.schema.hash,docs:t});return Object(s.a)(this.collection.importDump(e))}))}docs(t){return this.collectionLoaded$().pipe(Object(a.a)(()=>this.collection.find(t).$))}allDocs(){return Object(r.a)(()=>Object(n.a)(this,void 0,void 0,function*(){try{return(yield this.collection.pouch.allDocs({include_docs:!0,attachments:!1,startkey:"_design\uffff"})).rows.map(({doc:t,id:e})=>Object.assign(Object.assign({},t),{id:e}))}catch(t){return[]}}))}insertLocal(t,e){return Object(s.a)(this.collection.upsertLocal(t,e))}getLocal(t){return this.collectionLoaded$().pipe(Object(a.a)(()=>Object(s.a)(this.collection.getLocal(t))))}updateLocal(t,e,o){return Object(r.a)(()=>Object(n.a)(this,void 0,void 0,function*(){const n=yield this.collection.getLocal(t);n.set(e,o),yield n.save()}))}removeLocal(t){return Object(r.a)(()=>Object(n.a)(this,void 0,void 0,function*(){return(yield this.collection.getLocal(t)).remove()}))}get(t){return this.collectionLoaded$().pipe(Object(a.a)(()=>Object(s.a)(this.collection.findOne(t).exec())))}getById(t){return this.collectionLoaded$().pipe(Object(a.a)(()=>this.collection.findByIds$([t]).pipe(Object(l.a)(e=>e.size?e.get(t):null))))}insert(t){return Object(s.a)(this.collection.insert(t))}bulkInsert(t){return Object(s.a)(this.collection.bulkInsert(t))}upsert(t){return Object(s.a)(this.collection.upsert(t))}update(t,e){return Object(r.a)(()=>Object(n.a)(this,void 0,void 0,function*(){return(yield this.collection.findOne(t).exec()).update({$set:Object.assign({},e)})}))}set(t,e,o){return Object(r.a)(()=>Object(n.a)(this,void 0,void 0,function*(){const n=yield this.collection.findOne(t).exec();return n.set(e,o),n.save()}))}remove(t){return Object(r.a)(()=>Object(n.a)(this,void 0,void 0,function*(){return(yield this.collection.findOne(t).exec()).remove()}))}removeBulkBy(t){return this.collectionLoaded$().pipe(Object(a.a)(()=>Object(s.a)(this.collection.find(t).remove())))}_removeBulkBy(t){return Object(r.a)(()=>Object(n.a)(this,void 0,void 0,function*(){try{const e=yield this.collection.find(t).exec();if(e&&e.length){const t=e.map(t=>({_id:t.primary,_rev:t._rev,_deleted:!0}));return this.collection.pouch.bulkDocs(t)}}catch(e){return null}}))}}return t.\u0275fac=function(e){return new(e||t)(b.Pb(u.a),b.Pb(h.b))},t.\u0275prov=b.Cb({token:t,factory:t.\u0275fac}),t})()}},[[1,0,5]]]);