!function(){function e(n){var o="function"==typeof Map?new Map:void 0;return(e=function(e){if(null===e||(n=e,-1===Function.toString.call(n).indexOf("[native code]")))return e;var n;if("function"!=typeof e)throw new TypeError("Super expression must either be null or a function");if(void 0!==o){if(o.has(e))return o.get(e);o.set(e,i)}function i(){return t(e,arguments,u(this).constructor)}return i.prototype=Object.create(e.prototype,{constructor:{value:i,enumerable:!1,writable:!0,configurable:!0}}),r(i,e)})(n)}function t(e,n,o){return(t=a()?Reflect.construct:function(e,t,n){var o=[null];o.push.apply(o,t);var i=new(Function.bind.apply(e,o));return n&&r(i,n.prototype),i}).apply(null,arguments)}function n(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function");e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,writable:!0,configurable:!0}}),t&&r(e,t)}function r(e,t){return(r=Object.setPrototypeOf||function(e,t){return e.__proto__=t,e})(e,t)}function o(e){var t=a();return function(){var n,r=u(e);if(t){var o=u(this).constructor;n=Reflect.construct(r,arguments,o)}else n=r.apply(this,arguments);return i(this,n)}}function i(e,t){return!t||"object"!=typeof t&&"function"!=typeof t?c(e):t}function c(e){if(void 0===e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return e}function a(){if("undefined"==typeof Reflect||!Reflect.construct)return!1;if(Reflect.construct.sham)return!1;if("function"==typeof Proxy)return!0;try{return Date.prototype.toString.call(Reflect.construct(Date,[],function(){})),!0}catch(e){return!1}}function u(e){return(u=Object.setPrototypeOf?Object.getPrototypeOf:function(e){return e.__proto__||Object.getPrototypeOf(e)})(e)}function s(e,t){var n;if("undefined"==typeof Symbol||null==e[Symbol.iterator]){if(Array.isArray(e)||(n=function(e,t){if(!e)return;if("string"==typeof e)return l(e,t);var n=Object.prototype.toString.call(e).slice(8,-1);"Object"===n&&e.constructor&&(n=e.constructor.name);if("Map"===n||"Set"===n)return Array.from(e);if("Arguments"===n||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n))return l(e,t)}(e))||t&&e&&"number"==typeof e.length){n&&(e=n);var r=0,o=function(){};return{s:o,n:function(){return r>=e.length?{done:!0}:{done:!1,value:e[r++]}},e:function(e){throw e},f:o}}throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}var i,c=!0,a=!1;return{s:function(){n=e[Symbol.iterator]()},n:function(){var e=n.next();return c=e.done,e},e:function(e){a=!0,i=e},f:function(){try{c||null==n.return||n.return()}finally{if(a)throw i}}}}function l(e,t){(null==t||t>e.length)&&(t=e.length);for(var n=0,r=new Array(t);n<t;n++)r[n]=e[n];return r}function f(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function d(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}function p(e,t,n){return t&&d(e.prototype,t),n&&d(e,n),e}(window.webpackJsonp=window.webpackJsonp||[]).push([[1],{"+diW":function(e,t,n){"use strict";n.d(t,"a",function(){return _});var r,o,i=n("mrSG"),c=n("S6qK"),a=n("90xe"),u=n("Re7d"),l=n("A8VM"),d=n("g0lL"),h=n("UDat"),v=n("wnDG"),b=n("m1nw"),m=n("Jcva"),g=n("AzR3"),y=n("uugc"),O=n("Lj5c"),j={name:"ngx",adapter:"idb",multiInstance:!1,ignoreDuplicate:!0,pouchSettings:{skip_setup:!0,ajax:{withCredentials:!1,cache:!1,timeout:1e4,headers:{}}}},w=function(e){return 0===e?2e3:3*e},x=n("eBm/"),k=n("fXoL");Object(c.a)(n("ezGW")),Object(c.a)(n("Wh65")),Object(c.a)(y.a),Object(c.a)(b.a),Object(c.a)(h.a),Object(c.a)(l.a),Object(c.a)(v.a),Object(c.a)(m.a),Object(c.a)(g.a),(null===(o=null===(r=window.process)||void 0===r?void 0:r.env)||void 0===o?void 0:o.TEST)&&Object(x.c)("dev or test mode");var R,_=((R=function(){function e(){f(this,e),this._imported=window.localStorage._ngx_rxdb_imported}return p(e,[{key:"destroyDb",value:function(){return Object(i.a)(this,void 0,void 0,regeneratorRuntime.mark(function e(){return regeneratorRuntime.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:return e.prev=0,e.next=3,this.dbInstance.remove();case 3:return e.next=5,this.dbInstance.destroy();case 5:this.dbInstance=null,e.next=10;break;case 8:e.prev=8,e.t0=e.catch(0);case 10:case"end":return e.stop()}},e,this,[[0,8]])}))}},{key:"initDb",value:function(t){var n,r,o,c;return Object(i.a)(this,void 0,void 0,regeneratorRuntime.mark(function i(){var u,s,l,f;return regeneratorRuntime.wrap(function(i){for(;;)switch(i.prev=i.next){case 0:return i.prev=0,u=e.mergeConfig(t),i.next=4,Object(a.b)(u);case 4:if(s=i.sent,this.dbInstance=s,Object(x.c)("created database "+this.db.name),Object(x.b)(null===(n=u.options)||void 0===n?void 0:n.schemas)){i.next=10;break}return i.next=8,this.initCollections(u.options.schemas);case 8:l=i.sent,Object(x.c)("created ".concat(Object.keys(l).length," collections bulk: ").concat(Object.keys(l)));case 10:if(!(null===(r=u.options)||void 0===r?void 0:r.dumpPath)){i.next=20;break}return i.next=13,fetch(u.options.dumpPath);case 13:return i.next=15,i.sent.json();case 15:if(f=i.sent,i.t0=this._imported&&this._imported===(null===(o=f.timestamp)||void 0===o?void 0:o.toString()),i.t0){i.next=20;break}return i.next=20,this.importDbDump(f);case 20:i.next=25;break;case 22:throw i.prev=22,i.t1=i.catch(0),new x.a(null!==(c=i.t1.message)&&void 0!==c?c:i.t1);case 25:case"end":return i.stop()}},i,this,[[0,22]])}))}},{key:"initCollections",value:function(e){var t;return Object(i.a)(this,void 0,void 0,regeneratorRuntime.mark(function n(){var r;return regeneratorRuntime.wrap(function(n){for(;;)switch(n.prev=n.next){case 0:return n.prev=0,n.next=3,this.prepareCollections(e);case 3:return r=n.sent,n.next=6,this.dbInstance.addCollections(r);case 6:return n.abrupt("return",n.sent);case 9:throw n.prev=9,n.t0=n.catch(0),new x.a(null!==(t=n.t0.message)&&void 0!==t?t:n.t0);case 12:case"end":return n.stop()}},n,this,[[0,9]])}))}},{key:"initCollection",value:function(e){var t,n;return Object(i.a)(this,void 0,void 0,regeneratorRuntime.mark(function r(){var o,i,c,a,s;return regeneratorRuntime.wrap(function(r){for(;;)switch(r.prev=r.next){case 0:if(o=this.getCollection(e.name),!Object(u.c)(o)){r.next=8;break}if(r.t0=null===(t=e.options)||void 0===t?void 0:t.recreate,!r.t0){r.next=6;break}return r.next=6,o.remove();case 6:return Object(x.c)("collection",o.name,"exists, skip create"),r.abrupt("return",o);case 8:return r.next=10,this.prepareCollections((l={},f=e.name,d=e,f in l?Object.defineProperty(l,f,{value:d,enumerable:!0,configurable:!0,writable:!0}):l[f]=d,l));case 10:return i=r.sent,r.next=13,this.dbInstance.addCollections(i);case 13:if(r.t1=e.name,o=r.sent[r.t1],Object(x.c)('created collection "'.concat(o.name,'"')),!(null===(n=e.options)||void 0===n?void 0:n.initialDocs)){r.next=29;break}return r.next=19,o.info();case 19:return c=r.sent,r.next=22,o.countAllDocuments();case 22:if((a=r.sent)||!(c.update_seq<=1)){r.next=29;break}return Object(x.c)('collection "'.concat(o.name,'" has "').concat(parseInt(a,0),'" docs')),s=new O.b({name:o.name,schemaHash:o.schema.hash,docs:e.options.initialDocs}),r.next=28,o.importDump(s);case 28:Object(x.c)("imported ".concat(e.options.initialDocs.length,' docs for collection "').concat(o.name,'"'));case 29:return r.abrupt("return",o);case 30:case"end":return r.stop()}var l,f,d},r,this)}))}},{key:"getCollection",value:function(e){var t=this.db[e];return Object(u.c)(t)?t:(Object(x.c)("returned false for RxDB.isRxCollection(".concat(e,")")),null)}},{key:"syncCollection",value:function(e){var t,n,r=arguments.length>1&&void 0!==arguments[1]?arguments[1]:"db",o=arguments.length>2?arguments[2]:void 0;if(null===(n=null===(t=e.options)||void 0===t?void 0:t.syncOptions)||void 0===n?void 0:n.remote){var i=e.options.syncOptions;return i.remote=i.remote.concat("/",r),i.options=Object.assign({back_off_function:w},this.db.pouchSettings.ajax,i.options),o&&(i.options.headers=Object.assign({},i.options.headers,o)),i.queryObj&&(i.query=e.find(i.queryObj)),e.sync(i)}}},{key:"syncAllCollections",value:function(){var e=this,t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:"db",n=arguments.length>1?arguments[1]:void 0;if(Object(x.b)(this.collections))throw new x.a("collections must be initialized before importing dump");var r=[];return Object.values(this.collections).filter(function(e){return"remote"in e.options.syncOptions}).forEach(function(o){var i=e.syncCollection(o,t,n);r.push(i)}),Object(x.c)("syncAllCollections = ",r),r}},{key:"importDbDump",value:function(e){var t;return Object(i.a)(this,void 0,void 0,regeneratorRuntime.mark(function n(){return regeneratorRuntime.wrap(function(n){for(;;)switch(n.prev=n.next){case 0:return n.prev=0,n.next=3,this.db.importDump(this.prepareDbDump(e));case 3:this._imported=e.timestamp,n.next=11;break;case 6:if(n.prev=6,n.t0=n.catch(0),409===n.t0.status){n.next=10;break}throw new x.a(null!==(t=n.t0.message)&&void 0!==t?t:n.t0);case 10:this._imported=e.timestamp;case 11:case"end":return n.stop()}},n,this,[[0,6]])}))}},{key:"prepareCollections",value:function(e){var t,n;return Object(i.a)(this,void 0,void 0,regeneratorRuntime.mark(function r(){var o,i,c,a,u;return regeneratorRuntime.wrap(function(r){for(;;)switch(r.prev=r.next){case 0:r.prev=0,o={},i=Object.values(e),c=0,a=i;case 3:if(!(c<a.length)){r.next=15;break}if(u=a[c],r.t0=!u.schema&&(null===(t=u.options)||void 0===t?void 0:t.schemaUrl),!r.t0){r.next=10;break}return r.next=9,O.a.fetchSchema(u.options.schemaUrl);case 9:u.schema=r.sent;case 10:Object(d.a)(u.schema),o[u.name]=new O.a(u);case 12:c++,r.next=3;break;case 15:return r.abrupt("return",o);case 18:throw r.prev=18,r.t1=r.catch(0),new x.a(null!==(n=r.t1.message)&&void 0!==n?n:r.t1);case 21:case"end":return r.stop()}},r,null,[[0,18]])}))}},{key:"prepareDbDump",value:function(e){var t=new O.c(e);if(Object(x.b)(this.collections))throw new x.a("collections must be initialized before importing");var n,r=s(t.collections);try{for(r.s();!(n=r.n()).done;){var o=n.value,i=this.getCollection(o.name);if(!i)throw new x.a("no such collection as provided in dump");o.schemaHash=i.schema._hash}}catch(c){r.e(c)}finally{r.f()}return t}},{key:"db",get:function(){return this.dbInstance}},{key:"collections",get:function(){return this.db.collections}},{key:"_imported",get:function(){return window.localStorage._ngx_rxdb_imported},set:function(e){window.localStorage._ngx_rxdb_imported=e}}],[{key:"mergeConfig",value:function(e){return Object.assign({},j,e)}},{key:"getCouchAuthProxyHeaders",value:function(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:"",t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:[],n=arguments.length>2&&void 0!==arguments[2]?arguments[2]:"";return{"X-Auth-CouchDB-UserName":e,"X-Auth-CouchDB-Roles":t.join(","),"X-Auth-CouchDB-Token":n}}}]),e}()).\u0275fac=function(e){return new(e||R)},R.\u0275prov=k.Cb({token:R,factory:R.\u0275fac}),R)},"0awm":function(e,t,n){"use strict";n.d(t,"a",function(){return r});var r=new(n("fXoL").q)("NgxRxdbConfig")},1:function(e,t,n){e.exports=n("Hasg")},2:function(e,t){},3:function(e,t){},4:function(e,t){},Hasg:function(e,t,n){"use strict";n.r(t);var r=n("fXoL");process,process,Boolean(process.env.COUCHDB_SYNC_LIVE),Boolean(process.env.COUCHDB_SYNC_HEARTBEAT);var o,i=n("jhN1"),c=n("tyNb"),a=n("ORsI"),u=((o=function e(){f(this,e)}).\u0275fac=function(e){return new(e||o)},o.\u0275cmp=r.Ab({type:o,selectors:[["demo-root"]],decls:2,vars:0,template:function(e,t){1&e&&(r.Lb(0,"main"),r.Hb(1,"router-outlet"),r.Kb())},directives:[c.b],styles:["[_nghost-%COMP%] {\n        display: block;\n        font: 14px 'Helvetica Neue', Helvetica, Arial, sans-serif;\n        line-height: 1.4em;\n        background: #f5f5f5;\n        color: #4d4d4d;\n        min-width: 230px;\n        max-width: 550px;\n        margin: 0 auto;\n        -webkit-font-smoothing: antialiased;\n        -moz-osx-font-smoothing: grayscale;\n        font-weight: 300;\n      }\n\n      .flex[_ngcontent-%COMP%] {\n        display: flex;\n        align-items: center;\n        justify-content: center;\n      }"]}),o);n("eiuk");var s,l={name:"demo",adapter:"idb",multiInstance:!0,options:{}},d=[{path:"todos",loadChildren:function(){return n.e(6).then(n.bind(null,"9FVm")).then(function(e){return e.TodosModule})}},{path:"",redirectTo:"todos",pathMatch:"full"}],p=((s=function e(){f(this,e)}).\u0275mod=r.Eb({type:s,bootstrap:[u]}),s.\u0275inj=r.Db({factory:function(e){return new(e||s)},providers:[],imports:[[i.a,c.a.forRoot(d),a.b.forRoot(l)]]}),s);Object(r.R)(),i.b().bootstrapModule(p).catch(function(e){return console.error(e)})},Lj5c:function(e,t,n){"use strict";n.d(t,"a",function(){return c}),n.d(t,"c",function(){return a}),n.d(t,"b",function(){return u});var r=n("mrSG"),o={},i={info:function(){return Object(r.a)(this,void 0,void 0,regeneratorRuntime.mark(function e(){return regeneratorRuntime.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:return e.next=2,this.pouch.info();case 2:return e.abrupt("return",e.sent);case 3:case"end":return e.stop()}},e,this)}))},countAllDocuments:function(){return Object(r.a)(this,void 0,void 0,regeneratorRuntime.mark(function e(){return regeneratorRuntime.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:return e.next=2,this.pouch.allDocs({include_docs:!1,attachments:!1,deleted:"ok",startkey:"_design\uffff"});case 2:return e.abrupt("return",e.sent.rows.length);case 3:case"end":return e.stop()}},e,this)}))}},c=function(){function e(t,n){f(this,e),Object.assign(this,Object.assign(Object.assign({},t),{pouchSettings:Object.assign(Object.assign({},n),t.pouchSettings),methods:Object.assign(Object.assign({},o),t.methods),statics:Object.assign(Object.assign({},i),t.statics)}))}return p(e,null,[{key:"fetchSchema",value:function(e){return Object(r.a)(this,void 0,void 0,regeneratorRuntime.mark(function t(){return regeneratorRuntime.wrap(function(t){for(;;)switch(t.prev=t.next){case 0:return t.next=2,fetch(e);case 2:return t.next=4,t.sent.json();case 4:return t.abrupt("return",t.sent);case 5:case"end":return t.stop()}},t)}))}}]),e}(),a=function e(t){f(this,e),this.name="ngx-rxdb-dump",this.encrypted=!1,this.passwordHash=null,Object.assign(this,t)},u=function e(t){f(this,e),this.encrypted=!1,this.passwordHash=null,Object.assign(this,t)}},"LvJ/":function(e,t){function n(e){return Promise.resolve().then(function(){var t=new Error("Cannot find module '"+e+"'");throw t.code="MODULE_NOT_FOUND",t})}n.keys=function(){return[]},n.resolve=n,e.exports=n,n.id="LvJ/"},ORsI:function(e,t,n){"use strict";n.d(t,"a",function(){return r.a}),n.d(t,"b",function(){return o.a}),n("Ru/n"),n("0awm"),n("+diW");var r=n("pyNe"),o=(n("Lj5c"),n("eiuk"))},"Ru/n":function(e,t,r){"use strict";r.d(t,"a",function(){return a});var i=r("ofXK"),c=r("fXoL"),a=function(){var e=function(e){n(r,e);var t=o(r);function r(){return f(this,r),t.apply(this,arguments)}return r}(i.b);return e.\u0275fac=function(t){return u(t||e)},e.\u0275pipe=c.Fb({name:"asyncNoZone",type:e,pure:!1}),e}(),u=c.Nb(a);a.prototype._updateLatestValue=function(e,t){e===this._obj&&(this._latestValue=t,this._ref.detectChanges())}},"eBm/":function(t,r,i){"use strict";function a(e){var t=arguments.length>1&&void 0!==arguments[1]&&arguments[1];return null==e||!e||!Object.keys(e).length||!!t&&Object.values(e).every(function(e){return null===e||!e})}function u(){}function s(){for(var e,t,n,r=arguments.length,o=new Array(r),i=0;i<r;i++)o[i]=arguments[i];(null===(n=null===(t=window.process)||void 0===t?void 0:t.env)||void 0===n?void 0:n.DEBUG)&&(e=console.log).call.apply(e,[console,"%c[DEBUG:: NgxRxdb::]","background: #8d2089; color: #fff; padding: 2px; font-size: normal;"].concat(o))}i.d(r,"b",function(){return a}),i.d(r,"d",function(){return u}),i.d(r,"c",function(){return s}),i.d(r,"a",function(){return l});var l=function(e){n(r,e);var t=o(r);function r(e){var n;return f(this,r),(n=t.call(this,e)).name=n.constructor.name,Object.setPrototypeOf(c(n),r.prototype),n}return r}(e(Error))},eiuk:function(e,t,n){"use strict";n.d(t,"a",function(){return d});var r=n("mrSG"),o=n("fXoL"),i=n("Cfvw"),c=n("pyNe"),a=n("+diW"),u=n("0awm"),s=n("eBm/");function l(e,t){var n=this;return function(){return Object(r.a)(n,void 0,void 0,regeneratorRuntime.mark(function n(){return regeneratorRuntime.wrap(function(n){for(;;)switch(n.prev=n.next){case 0:return n.next=2,e.initDb(t);case 2:case"end":return n.stop()}},n)}))}}var d=function(){var e=function(){function e(t,n,r,o){if(f(this,e),!r&&!n)throw new Error(u.a.toString()+" is not provided. Make sure you call the 'forRoot' method of the NgxRxdbModule in the AppModule only.");if(r&&n)throw new Error(u.a.toString()+" is already provided. Make sure you call the 'forRoot' method of the NgxRxdbModule in the AppModule only.");r&&!n&&Object(i.a)(t.donePromise).subscribe(function(){})}return p(e,null,[{key:"forFeature",value:function(e){return{ngModule:h,providers:[{provide:c.a,useFactory:(t=e,function(e){return new c.a(e,t)}),deps:[a.a]}]};var t}},{key:"forRoot",value:function(t){return{ngModule:e,providers:[{provide:u.a,useValue:t},a.a,{provide:o.d,useFactory:l,deps:[a.a,u.a],multi:!0}]}}}]),e}();return e.\u0275mod=o.Eb({type:e}),e.\u0275inj=o.Db({factory:function(t){return new(t||e)(o.Pb(o.e),o.Pb(u.a,12),o.Pb(u.a,10),o.Pb(a.a,14))}}),e}(),h=function(){var e=function e(t){f(this,e),this.collectionService=t,this.collectionService.collectionLoaded$().subscribe(s.d)};return e.\u0275mod=o.Eb({type:e}),e.\u0275inj=o.Db({factory:function(t){return new(t||e)(o.Pb(c.a))}}),e}()},pyNe:function(e,t,n){"use strict";n.d(t,"a",function(){return h});var r=n("mrSG"),o=n("Re7d"),i=n("jtHE"),c=n("Cfvw"),a=n("NXyV"),u=n("eIep"),s=n("lJxs"),l=n("Lj5c"),d=(n("+diW"),n("fXoL")),h=function(){var e=function(){function e(t,n){f(this,e),this.dbService=t,this.config=n}return p(e,[{key:"ngOnDestroy",value:function(){return Object(r.a)(this,void 0,void 0,regeneratorRuntime.mark(function e(){return regeneratorRuntime.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:if(e.t0=Object(o.c)(this.collection),!e.t0){e.next=4;break}return e.next=4,this.collection.destroy();case 4:case"end":return e.stop()}},e,this)}))}},{key:"collectionLoaded$",value:function(){var e=this;return this.inited$||(this.inited$=new i.a,this.dbService.initCollection(this.config).then(function(t){e._collection=t,e.inited$.next(!0),e.inited$.complete()})),this.inited$.asObservable()}},{key:"sync",value:function(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:"db",t=arguments.length>1?arguments[1]:void 0;return this.dbService.syncCollection(this.collection,e,t)}},{key:"import",value:function(e){var t=this;return this.collectionLoaded$().pipe(Object(u.a)(function(){var n=new l.b({name:t.collection.name,schemaHash:t.collection.schema.hash,docs:e});return Object(c.a)(t.collection.importDump(n))}))}},{key:"docs",value:function(e){var t=this;return this.collectionLoaded$().pipe(Object(u.a)(function(){return t.collection.find(e).$}))}},{key:"allDocs",value:function(){var e=this;return Object(a.a)(function(){return Object(r.a)(e,void 0,void 0,regeneratorRuntime.mark(function e(){return regeneratorRuntime.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:return e.prev=0,e.next=3,this.collection.pouch.allDocs({include_docs:!0,attachments:!1,startkey:"_design\uffff"});case 3:return e.abrupt("return",e.sent.rows.map(function(e){var t=e.doc,n=e.id;return Object.assign(Object.assign({},t),{id:n})}));case 6:return e.prev=6,e.t0=e.catch(0),e.abrupt("return",[]);case 9:case"end":return e.stop()}},e,this,[[0,6]])}))})}},{key:"insertLocal",value:function(e,t){return Object(c.a)(this.collection.upsertLocal(e,t))}},{key:"getLocal",value:function(e){var t=this;return this.collectionLoaded$().pipe(Object(u.a)(function(){return Object(c.a)(t.collection.getLocal(e))}))}},{key:"updateLocal",value:function(e,t,n){var o=this;return Object(a.a)(function(){return Object(r.a)(o,void 0,void 0,regeneratorRuntime.mark(function r(){var o;return regeneratorRuntime.wrap(function(r){for(;;)switch(r.prev=r.next){case 0:return r.next=2,this.collection.getLocal(e);case 2:return(o=r.sent).set(t,n),r.next=6,o.save();case 6:case"end":return r.stop()}},r,this)}))})}},{key:"removeLocal",value:function(e){var t=this;return Object(a.a)(function(){return Object(r.a)(t,void 0,void 0,regeneratorRuntime.mark(function t(){return regeneratorRuntime.wrap(function(t){for(;;)switch(t.prev=t.next){case 0:return t.next=2,this.collection.getLocal(e);case 2:return t.abrupt("return",t.sent.remove());case 3:case"end":return t.stop()}},t,this)}))})}},{key:"get",value:function(e){var t=this;return this.collectionLoaded$().pipe(Object(u.a)(function(){return Object(c.a)(t.collection.findOne(e).exec())}))}},{key:"getById",value:function(e){var t=this;return this.collectionLoaded$().pipe(Object(u.a)(function(){return t.collection.findByIds$([e]).pipe(Object(s.a)(function(t){return t.size?t.get(e):null}))}))}},{key:"insert",value:function(e){return Object(c.a)(this.collection.insert(e))}},{key:"bulkInsert",value:function(e){return Object(c.a)(this.collection.bulkInsert(e))}},{key:"upsert",value:function(e){return Object(c.a)(this.collection.upsert(e))}},{key:"update",value:function(e,t){var n=this;return Object(a.a)(function(){return Object(r.a)(n,void 0,void 0,regeneratorRuntime.mark(function n(){return regeneratorRuntime.wrap(function(n){for(;;)switch(n.prev=n.next){case 0:return n.next=2,this.collection.findOne(e).exec();case 2:return n.abrupt("return",n.sent.update({$set:Object.assign({},t)}));case 3:case"end":return n.stop()}},n,this)}))})}},{key:"set",value:function(e,t,n){var o=this;return Object(a.a)(function(){return Object(r.a)(o,void 0,void 0,regeneratorRuntime.mark(function r(){var o;return regeneratorRuntime.wrap(function(r){for(;;)switch(r.prev=r.next){case 0:return r.next=2,this.collection.findOne(e).exec();case 2:return o=r.sent,r.abrupt("return",(o.set(t,n),o.save()));case 4:case"end":return r.stop()}},r,this)}))})}},{key:"remove",value:function(e){var t=this;return Object(a.a)(function(){return Object(r.a)(t,void 0,void 0,regeneratorRuntime.mark(function t(){return regeneratorRuntime.wrap(function(t){for(;;)switch(t.prev=t.next){case 0:return t.next=2,this.collection.findOne(e).exec();case 2:return t.abrupt("return",t.sent.remove());case 3:case"end":return t.stop()}},t,this)}))})}},{key:"removeBulkBy",value:function(e){var t=this;return this.collectionLoaded$().pipe(Object(u.a)(function(){return Object(c.a)(t.collection.find(e).remove())}))}},{key:"updateBulkBy",value:function(e,t){var n=this;return Object(a.a)(function(){return Object(r.a)(n,void 0,void 0,regeneratorRuntime.mark(function n(){var r,o;return regeneratorRuntime.wrap(function(n){for(;;)switch(n.prev=n.next){case 0:return n.prev=0,n.next=3,this.collection.find(e).exec();case 3:if(!(r=n.sent)||!r.length){n.next=7;break}return o=r.map(function(e){return Object.assign(Object.assign({_id:e.primary,_rev:e._rev},e.toJSON()),t)}),n.abrupt("return",this.collection.pouch.bulkDocs(o));case 7:n.next=12;break;case 9:return n.prev=9,n.t0=n.catch(0),n.abrupt("return",null);case 12:case"end":return n.stop()}},n,this,[[0,9]])}))})}},{key:"collection",get:function(){return this._collection}},{key:"db",get:function(){return this.dbService.db}}]),e}();return e.\u0275fac=function(e){d.Sb()},e.\u0275prov=d.Cb({token:e,factory:e.\u0275fac}),e}()}},[[1,0,5]]])}();