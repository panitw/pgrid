!function(t){var e={};function i(s){if(e[s])return e[s].exports;var n=e[s]={i:s,l:!1,exports:{}};return t[s].call(n.exports,n,n.exports,i),n.l=!0,n.exports}i.m=t,i.c=e,i.d=function(t,e,s){i.o(t,e)||Object.defineProperty(t,e,{enumerable:!0,get:s})},i.r=function(t){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})},i.t=function(t,e){if(1&e&&(t=i(t)),8&e)return t;if(4&e&&"object"==typeof t&&t&&t.__esModule)return t;var s=Object.create(null);if(i.r(s),Object.defineProperty(s,"default",{enumerable:!0,value:t}),2&e&&"string"!=typeof t)for(var n in t)i.d(s,n,function(e){return t[e]}.bind(null,n));return s},i.n=function(t){var e=t&&t.__esModule?function(){return t.default}:function(){return t};return i.d(e,"a",e),e},i.o=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)},i.p="/",i(i.s=0)}([function(t,e,i){"use strict";i.r(e);class s{constructor(){this._handlers={}}listen(t,e){this._handlers[t]||(this._handlers[t]=[]),this._handlers[t].push(e)}unlisten(t,e){if(this._handlers[t]){let i=this._handlers[t].indexOf(e);i>-1&&this._handlers[t].splice(i,1)}}hasListener(t){return this._handlers[t]&&this._handlers[t].length>0}dispatch(t,e){if(this.hasListener(t)){let i=this._handlers[t];for(let t=0;t<i.length;t++)i[t](e)}}}var n=function(){if("undefined"!=typeof Map)return Map;function t(t,e){var i=-1;return t.some(function(t,s){return t[0]===e&&(i=s,!0)}),i}return function(){function e(){this.__entries__=[]}var i={size:{configurable:!0}};return i.size.get=function(){return this.__entries__.length},e.prototype.get=function(e){var i=t(this.__entries__,e),s=this.__entries__[i];return s&&s[1]},e.prototype.set=function(e,i){var s=t(this.__entries__,e);~s?this.__entries__[s][1]=i:this.__entries__.push([e,i])},e.prototype.delete=function(e){var i=this.__entries__,s=t(i,e);~s&&i.splice(s,1)},e.prototype.has=function(e){return!!~t(this.__entries__,e)},e.prototype.clear=function(){this.__entries__.splice(0)},e.prototype.forEach=function(t,e){void 0===e&&(e=null);for(var i=0,s=this.__entries__;i<s.length;i+=1){var n=s[i];t.call(e,n[1],n[0])}},Object.defineProperties(e.prototype,i),e}()}(),o="undefined"!=typeof window&&"undefined"!=typeof document&&window.document===document,r="undefined"!=typeof global&&global.Math===Math?global:"undefined"!=typeof self&&self.Math===Math?self:"undefined"!=typeof window&&window.Math===Math?window:Function("return this")(),l="function"==typeof requestAnimationFrame?requestAnimationFrame.bind(r):function(t){return setTimeout(function(){return t(Date.now())},1e3/60)},h=2,d=["top","right","bottom","left","width","height","size","weight"],a="undefined"!=typeof MutationObserver,c=function(){this.connected_=!1,this.mutationEventsAdded_=!1,this.mutationsObserver_=null,this.observers_=[],this.onTransitionEnd_=this.onTransitionEnd_.bind(this),this.refresh=function(t,e){var i=!1,s=!1,n=0;function o(){i&&(i=!1,t()),s&&d()}function r(){l(o)}function d(){var t=Date.now();if(i){if(t-n<h)return;s=!0}else i=!0,s=!1,setTimeout(r,e);n=t}return d}(this.refresh.bind(this),20)};c.prototype.addObserver=function(t){~this.observers_.indexOf(t)||this.observers_.push(t),this.connected_||this.connect_()},c.prototype.removeObserver=function(t){var e=this.observers_,i=e.indexOf(t);~i&&e.splice(i,1),!e.length&&this.connected_&&this.disconnect_()},c.prototype.refresh=function(){this.updateObservers_()&&this.refresh()},c.prototype.updateObservers_=function(){var t=this.observers_.filter(function(t){return t.gatherActive(),t.hasActive()});return t.forEach(function(t){return t.broadcastActive()}),t.length>0},c.prototype.connect_=function(){o&&!this.connected_&&(document.addEventListener("transitionend",this.onTransitionEnd_),window.addEventListener("resize",this.refresh),a?(this.mutationsObserver_=new MutationObserver(this.refresh),this.mutationsObserver_.observe(document,{attributes:!0,childList:!0,characterData:!0,subtree:!0})):(document.addEventListener("DOMSubtreeModified",this.refresh),this.mutationEventsAdded_=!0),this.connected_=!0)},c.prototype.disconnect_=function(){o&&this.connected_&&(document.removeEventListener("transitionend",this.onTransitionEnd_),window.removeEventListener("resize",this.refresh),this.mutationsObserver_&&this.mutationsObserver_.disconnect(),this.mutationEventsAdded_&&document.removeEventListener("DOMSubtreeModified",this.refresh),this.mutationsObserver_=null,this.mutationEventsAdded_=!1,this.connected_=!1)},c.prototype.onTransitionEnd_=function(t){var e=t.propertyName;void 0===e&&(e=""),d.some(function(t){return!!~e.indexOf(t)})&&this.refresh()},c.getInstance=function(){return this.instance_||(this.instance_=new c),this.instance_},c.instance_=null;var _=function(t,e){for(var i=0,s=Object.keys(e);i<s.length;i+=1){var n=s[i];Object.defineProperty(t,n,{value:e[n],enumerable:!1,writable:!1,configurable:!0})}return t},u=function(t){return t&&t.ownerDocument&&t.ownerDocument.defaultView||r},f=y(0,0,0,0);function g(t){return parseFloat(t)||0}function p(t){for(var e=[],i=arguments.length-1;i-- >0;)e[i]=arguments[i+1];return e.reduce(function(e,i){return e+g(t["border-"+i+"-width"])},0)}function m(t){var e=t.clientWidth,i=t.clientHeight;if(!e&&!i)return f;var s=u(t).getComputedStyle(t),n=function(t){for(var e={},i=0,s=["top","right","bottom","left"];i<s.length;i+=1){var n=s[i],o=t["padding-"+n];e[n]=g(o)}return e}(s),o=n.left+n.right,r=n.top+n.bottom,l=g(s.width),h=g(s.height);if("border-box"===s.boxSizing&&(Math.round(l+o)!==e&&(l-=p(s,"left","right")+o),Math.round(h+r)!==i&&(h-=p(s,"top","bottom")+r)),!function(t){return t===u(t).document.documentElement}(t)){var d=Math.round(l+o)-e,a=Math.round(h+r)-i;1!==Math.abs(d)&&(l-=d),1!==Math.abs(a)&&(h-=a)}return y(n.left,n.top,l,h)}var w="undefined"!=typeof SVGGraphicsElement?function(t){return t instanceof u(t).SVGGraphicsElement}:function(t){return t instanceof u(t).SVGElement&&"function"==typeof t.getBBox};function v(t){return o?w(t)?function(t){var e=t.getBBox();return y(0,0,e.width,e.height)}(t):m(t):f}function y(t,e,i,s){return{x:t,y:e,width:i,height:s}}var b=function(t){this.broadcastWidth=0,this.broadcastHeight=0,this.contentRect_=y(0,0,0,0),this.target=t};b.prototype.isActive=function(){var t=v(this.target);return this.contentRect_=t,t.width!==this.broadcastWidth||t.height!==this.broadcastHeight},b.prototype.broadcastRect=function(){var t=this.contentRect_;return this.broadcastWidth=t.width,this.broadcastHeight=t.height,t};var x=function(t,e){var i,s,n,o,r,l,h,d=(s=(i=e).x,n=i.y,o=i.width,r=i.height,l="undefined"!=typeof DOMRectReadOnly?DOMRectReadOnly:Object,h=Object.create(l.prototype),_(h,{x:s,y:n,width:o,height:r,top:n,right:s+o,bottom:r+n,left:s}),h);_(this,{target:t,contentRect:d})},C=function(t,e,i){if(this.activeObservations_=[],this.observations_=new n,"function"!=typeof t)throw new TypeError("The callback provided as parameter 1 is not a function.");this.callback_=t,this.controller_=e,this.callbackCtx_=i};C.prototype.observe=function(t){if(!arguments.length)throw new TypeError("1 argument required, but only 0 present.");if("undefined"!=typeof Element&&Element instanceof Object){if(!(t instanceof u(t).Element))throw new TypeError('parameter 1 is not of type "Element".');var e=this.observations_;e.has(t)||(e.set(t,new b(t)),this.controller_.addObserver(this),this.controller_.refresh())}},C.prototype.unobserve=function(t){if(!arguments.length)throw new TypeError("1 argument required, but only 0 present.");if("undefined"!=typeof Element&&Element instanceof Object){if(!(t instanceof u(t).Element))throw new TypeError('parameter 1 is not of type "Element".');var e=this.observations_;e.has(t)&&(e.delete(t),e.size||this.controller_.removeObserver(this))}},C.prototype.disconnect=function(){this.clearActive(),this.observations_.clear(),this.controller_.removeObserver(this)},C.prototype.gatherActive=function(){var t=this;this.clearActive(),this.observations_.forEach(function(e){e.isActive()&&t.activeObservations_.push(e)})},C.prototype.broadcastActive=function(){if(this.hasActive()){var t=this.callbackCtx_,e=this.activeObservations_.map(function(t){return new x(t.target,t.broadcastRect())});this.callback_.call(t,e,t),this.clearActive()}},C.prototype.clearActive=function(){this.activeObservations_.splice(0)},C.prototype.hasActive=function(){return this.activeObservations_.length>0};var E="undefined"!=typeof WeakMap?new WeakMap:new n,R=function(t){if(!(this instanceof R))throw new TypeError("Cannot call a class as a function.");if(!arguments.length)throw new TypeError("1 argument required, but only 0 present.");var e=c.getInstance(),i=new C(t,e,this);E.set(this,i)};["observe","unobserve","disconnect"].forEach(function(t){R.prototype[t]=function(){return(e=E.get(this))[t].apply(e,arguments);var e}});var M=void 0!==r.ResizeObserver?r.ResizeObserver:R;class S extends s{constructor(t,e){super(),this._model=t,this._extensions=e,this._template='<div class="pgrid-content-pane" style="position: relative;">\t<div class="pgrid-top-left-pane" style="position: absolute;">\t\t<div class="pgrid-top-left-inner" style="width: 100%; height: 100%; overflow: hidden; position: relative;"></div>\t</div>\t<div class="pgrid-top-pane" style="position: absolute;">\t\t<div class="pgrid-top-inner" style="width: 100%; height: 100%; overflow: hidden; position: relative;"></div>\t</div>\t<div class="pgrid-left-pane" style="position: absolute;">\t\t<div class="pgrid-left-inner" style="width: 100%; height: 100%; overflow: hidden; position: relative;"></div>\t</div>\t<div class="pgrid-center-pane" style="position: absolute;">\t\t<div class="pgrid-center-inner" style="width: 100%; height: 100%; overflow: hidden; position: relative;"></div>\t</div>\t<div class="pgrid-bottom-left-pane" style="position: absolute;">\t\t<div class="pgrid-bottom-left-inner" style="width: 100%; height: 100%; overflow: hidden; position: relative;"></div>\t</div>\t<div class="pgrid-bottom-pane" style="position: absolute;">\t\t<div class="pgrid-bottom-inner" style="width: 100%; height: 100%; overflow: hidden; position: relative;"></div>\t</div></div><div class="pgrid-hscroll" style="position: absolute; bottom: 0px; overflow-y: hidden; overflow-x: scroll;">\t<div class="pgrid-hscroll-thumb"></div></div><div class="pgrid-vscroll" style="position: absolute; right: 0px; top: 0px; overflow-y: scroll; overflow-x: hidden;">\t<div class="pgrid-vscroll-thumb"></div></div>'}render(t){this._element=t,this._element.className="pgrid",this._element.innerHTML=this._template,this._element.style.position="relative",this._element.style.overflow="hidden",this._element.tabIndex=1,this._contentPane=this._element.querySelector(".pgrid-content-pane"),this._topLeftPane=this._element.querySelector(".pgrid-top-left-pane"),this._topLeftInner=this._element.querySelector(".pgrid-top-left-inner"),this._topPane=this._element.querySelector(".pgrid-top-pane"),this._topInner=this._element.querySelector(".pgrid-top-inner"),this._leftPane=this._element.querySelector(".pgrid-left-pane"),this._leftInner=this._element.querySelector(".pgrid-left-inner"),this._centerPane=this._element.querySelector(".pgrid-center-pane"),this._centerInner=this._element.querySelector(".pgrid-center-inner"),this._bottomPane=this._element.querySelector(".pgrid-bottom-pane"),this._bottomInner=this._element.querySelector(".pgrid-bottom-inner"),this._bottomLeftPane=this._element.querySelector(".pgrid-bottom-left-pane"),this._bottomLeftInner=this._element.querySelector(".pgrid-bottom-left-inner"),this._scrollWidth=this._measureScrollbarWidth(),this._hScroll=this._element.querySelector(".pgrid-hscroll"),this._vScroll=this._element.querySelector(".pgrid-vscroll"),this._hScrollThumb=this._element.querySelector(".pgrid-hscroll-thumb"),this._vScrollThumb=this._element.querySelector(".pgrid-vscroll-thumb"),this._hScroll.style.height=this._scrollWidth+"px",this._vScroll.style.width=this._scrollWidth+"px",this._hScrollThumb.style.height=this._scrollWidth+"px",this._vScrollThumb.style.width=this._scrollWidth+"px",this._observeSize(),this._resturecture(),this._attachHandlers(),this._extensions.executeExtension("gridAfterRender",{grid:this})}reRender(){this._topLeftInner.innerHTML="",this._topInner.innerHTML="",this._leftInner.innerHTML="",this._centerInner.innerHTML="",this._bottomLeftInner.innerHTML="",this._bottomInner.innerHTML="",this._model.calcTotalSize(),this._resturecture()}getElement(){return this._element}setScrollX(t,e){this._topInner.scrollLeft=t,this._centerInner.scrollLeft=t,this._bottomInner.scrollLeft=t,(e||void 0===e)&&(this._hScroll.scrollLeft=t)}getScrollX(){return this._centerInner.scrollLeft}setScrollY(t,e){let i=this._leftInner.scrollHeight-this._leftInner.clientHeight;t>i&&(t=i),this._centerInner.scrollTop=t,this._leftInner.scrollTop=t,(e||void 0===e)&&(this._vScroll.scrollTop=t)}getScrollY(){return this._centerInner.scrollTop}scrollToCell(t,e,i){let s=this.getCell(t,e),n=s.parentElement.scrollTop,o=s.parentElement.scrollLeft;s.scrollIntoViewIfNeeded(!1),n!==s.parentElement.scrollTop&&this.setScrollY(s.parentElement.scrollTop,!0),o!==s.parentElement.scrollLeft&&this.setScrollX(s.parentElement.scrollLeft,!0)}getCell(t,e){return this._element.querySelector('[data-row-index="'+t+'"][data-col-index="'+e+'"]')}updateCell(t,e){let i=this.getCell(t,e);if(i){let s=null;i.firstChild&&i.firstChild.classList.contains("pgrid-cell-content")?s=i.firstChild:(i.innerHTML="",(s=document.createElement("div")).className="pgrid-cell-content",i.appendChild(s));let n=this._model.getDataAt(t,e),o={data:n};this._extensions.executeExtension("dataBeforeRender",o),n=o.data;let r=!1,l=this._model.getRowId(t),h=this._model.getColumnField(e);this._extensions.hasExtension("cellUpdate")&&(o={data:n,cell:i,cellContent:s,rowIndex:t,colIndex:e,rowId:l,field:h,handled:!1},this._extensions.executeExtension("cellUpdate",o),r=o.handled),r||(s.innerHTML=null!=n?n:""),this._extensions.executeExtension("cellAfterUpdate",{data:n,cell:i,cellContent:s,rowIndex:t,colIndex:e,rowId:l,field:h})}}_attachHandlers(){this._vScrollHandler=(t=>{this.setScrollY(t.target.scrollTop,!1),this.dispatch("vscroll",t)}),this._hScrollHandler=(t=>{this.setScrollX(t.target.scrollLeft,!1),this.dispatch("hscroll",t)}),this._wheelHandler=(t=>{let e=this.getScrollX(),i=this.getScrollY();this.setScrollX(e+t.deltaX),this.setScrollY(i+t.deltaY),0!==t.deltaX&&this.dispatch("hscroll",t),0!==t.deltaY&&this.dispatch("vscroll",t)}),this._keyDownHandler=(t=>{this._extensions.executeExtension("keyDown",t)}),this._vScroll.addEventListener("scroll",this._vScrollHandler),this._hScroll.addEventListener("scroll",this._hScrollHandler),this._contentPane.addEventListener("wheel",this._wheelHandler),this._element.addEventListener("keydown",this._keyDownHandler)}_resturecture(){this._contentPane.style.width="calc(100% - "+this._scrollWidth+"px)",this._contentPane.style.height="calc(100% - "+this._scrollWidth+"px)";let t=this._model.getTopFreezeSize(),e=this._model.getBottomFreezeSize(),i=this._model.getLeftFreezeSize();this._topLeftPane.style.left="0px",this._topLeftPane.style.top="0px",this._topLeftPane.style.width=i+"px",this._topLeftPane.style.height=t+"px",this._topPane.style.left=i+"px",this._topPane.style.top="0px",this._topPane.style.width="calc(100% - "+i+"px)",this._topPane.style.height=t+"px",this._leftPane.style.left="0px",this._leftPane.style.top=t+"px",this._leftPane.style.width=i+"px",this._leftPane.style.height="calc(100% - "+(t+e)+"px)",this._centerPane.style.left=i+"px",this._centerPane.style.top=t+"px",this._centerPane.style.width="calc(100% - "+i+"px)",this._centerPane.style.height="calc(100% - "+(t+e)+"px)",this._bottomLeftPane.style.left="0px",this._bottomLeftPane.style.bottom="0px",this._bottomLeftPane.style.width=i+"px",this._bottomLeftPane.style.height=e+"px",this._bottomPane.style.left=i+"px",this._bottomPane.style.bottom="0px",this._bottomPane.style.width="calc(100% - "+i+"px)",this._bottomPane.style.height=e+"px",this._renderCells(),this._updateScrollBar()}_observeSize(){this._resizeObserver=new M((t,e)=>{this._updateScrollBar()}),this._resizeObserver.observe(this._element)}_updateScrollBar(){let t=this._model.getTotalWidth(),e=this._model.getTotalHeight();this._hScrollThumb.style.width=t+"px",this._vScrollThumb.style.height=e+"px";let i=this._element.getBoundingClientRect();switch(this._model.determineScrollbarState(i.width,i.height,this._scrollWidth)){case"n":this._hScroll.style.display="none",this._vScroll.style.display="none",this._contentPane.style.width="100%",this._contentPane.style.height="100%";break;case"h":this._hScroll.style.display="block",this._vScroll.style.display="none",this._hScroll.style.width="100%",this._contentPane.style.width="100%",this._contentPane.style.height="calc(100% - "+this._scrollWidth+"px)";break;case"v":this._hScroll.style.display="none",this._vScroll.style.display="block",this._vScroll.style.height="100%",this._contentPane.style.width="calc(100% - "+this._scrollWidth+"px)",this._contentPane.style.height="100%";break;case"b":this._hScroll.style.display="block",this._vScroll.style.display="block",this._hScroll.style.width="calc(100% - "+this._scrollWidth+"px)",this._vScroll.style.height="calc(100% - "+this._scrollWidth+"px)",this._contentPane.style.width="calc(100% - "+this._scrollWidth+"px)",this._contentPane.style.height="calc(100% - "+this._scrollWidth+"px)"}}_renderCells(){let t=this._model.getTopFreezeRows(),e=this._model.getLeftFreezeRows(),i=this._model.getBottomFreezeRows(),s=this._model.getRowCount(),n=this._model.getColumnCount(),o=0,r=0,l=[];o=0;for(let i=0;i<t;i++){let t=this._model.getRowHeight(i);r=0;for(let s=0;s<e;s++)l[s]=this._model.getColumnWidth(s),this._renderCell(i,s,this._topLeftInner,r,o,l[s],t),r+=l[s];r=0;for(let s=e;s<n;s++)l[s]=this._model.getColumnWidth(s),this._renderCell(i,s,this._topInner,r,o,l[s],t),r+=l[s];o+=t}o=0;for(let h=t;h<s-i;h++){let t=this._model.getRowHeight(h);r=0;for(let i=0;i<e;i++)this._renderCell(h,i,this._leftInner,r,o,l[i],t),r+=l[i];r=0;for(let i=e;i<n;i++)this._renderCell(h,i,this._centerInner,r,o,l[i],t),r+=l[i];o+=t}o=0;for(let t=s-i;t<s;t++){let i=this._model.getRowHeight(t);r=0;for(let s=0;s<e;s++)this._renderCell(t,s,this._bottomLeftInner,r,o,l[s],i),r+=l[s];r=0;for(let s=e;s<n;s++)this._renderCell(t,s,this._bottomInner,r,o,l[s],i),r+=l[s];o+=i}}_renderCell(t,e,i,s,n,o,r){let l=this._model.getDataAt(t,e),h={data:l};this._extensions.executeExtension("dataBeforeRender",h),l=h.data;let d=document.createElement("div"),a=this._model.getCellClasses(t,e);d.className="pgrid-cell "+a.join(" "),d.style.left=s+"px",d.style.top=n+"px",d.style.width=o+"px",d.style.height=r+"px",d.dataset.rowIndex=t,d.dataset.colIndex=e;let c=document.createElement("div");c.className="pgrid-cell-content",d.appendChild(c),i.appendChild(d);let _={cell:d,cellContent:c,rowIndex:t,colIndex:e,data:l,rowId:this._model.getRowId(t),field:this._model.getColumnField(e),handled:!1},u=!1;this._extensions.hasExtension("cellRender")&&(this._extensions.executeExtension("cellRender",_),u=_.handled),u||void 0!==l&&(c.innerHTML=l),this._extensions.executeExtension("cellAfterRender",_),this._extensions.executeExtension("cellAfterUpdate",_),_=null}_measureScrollbarWidth(){var t=document.createElement("p");t.style.width="100%",t.style.height="200px";var e=document.createElement("div");e.className="pgrid";var i=document.createElement("div");i.style.position="absolute",i.style.top="0px",i.style.left="0px",i.style.visibility="hidden",i.style.width="200px",i.style.height="150px",i.style.overflow="hidden",i.appendChild(t),e.appendChild(i),document.body.appendChild(e);var s=t.offsetWidth;i.style.overflow="scroll";var n=t.offsetWidth;return s==n&&(n=i.clientWidth),document.body.removeChild(e),s-n+(this._detectIE()?1:0)}_detectIE(){var t=window.navigator.userAgent,e=t.indexOf("MSIE ");if(e>0)return parseInt(t.substring(e+5,t.indexOf(".",e)),10);if(t.indexOf("Trident/")>0){var i=t.indexOf("rv:");return parseInt(t.substring(i+3,t.indexOf(".",i)),10)}var s=t.indexOf("Edge/");return s>0&&parseInt(t.substring(s+5,t.indexOf(".",s)),10)}}class I extends s{constructor(t,e,i){if(super(),this._config=t,this._data=e,this._extension=i,this._columnModel=[],this._rowModel={},this._headerRowModel={},this._cellModel={},this._headerCellModel={},this._config.headerRows)for(let t=0;t<this._config.headerRows.length;t++)void 0!==this._config.headerRows[t].i&&(this._headerRowModel[this._config.headerRows[t].i]=this._config.headerRows[t]);if(this._config.columns)for(let t=0;t<this._config.columns.length;t++)void 0!==this._config.columns[t].i?this._columnModel[this._config.columns[t].i]=this._config.columns[t]:this._columnModel[t]=this._config.columns[t];if(this._config.rows)for(let t=0;t<this._config.rows.length;t++)this._rowModel[this._config.rows[t].i]=this._config.rows[t];if(this._config.cells)for(let t=0;t<this._config.cells.length;t++){let e=this._config.cells[t];this._cellModel[e.c]||(this._cellModel[e.c]={}),this._cellModel[e.c][e.r]=e}if(this._config.headerCells)for(let t=0;t<this._config.headerCells.length;t++){let e=this._config.headerCells[t];this._headerCellModel[e.c]||(this._headerCellModel[e.c]={}),this._headerCellModel[e.c][e.r]=e}this.calcTotalSize()}canEdit(t,e){let i=this.getRowModel(t),s=this.getColumnModel(e),n=this.getCellModel(t,e),o=!1;if((i&&i.editable||s&&s.editable||n&&n.editable)&&(o=!(i&&!1===i.editable||s&&!1===s.editable||n&&!1===n.editable)),this._extension.hasExtension("cellEditableCheck")){const r=this.getRowId(t),l={rowIndex:t,colIndex:e,rowId:r,field:this.getColumnField(e),dataRow:this._data.getRowData(r),rowModel:i,colModel:s,cellModel:n,canEdit:o};this._extension.executeExtension("cellEditableCheck",l),o=l.canEdit}return o}isHeaderRow(t){return t<this._config.headerRowCount}getColumnWidth(t){let e=this._columnModel[t];return e&&void 0!==e.width?e.width:this._config.columnWidth}getRowHeight(t){if(!this.isHeaderRow(t)){const e=t-this._config.headerRowCount;let i=this._rowModel[e];return i&&void 0!==i.height?i.height:this._config.rowHeight}}getColumnCount(){return this._config.columns.length}getRowCount(){return this._config.headerRowCount+this._data.getRowCount()}getTopFreezeRows(){let t=0;return void 0!==this._config.headerRowCount?t+=this._config.headerRowCount:t+=1,this._config.freezePane&&this._config.freezePane.top>0&&(t+=this._config.freezePane.top),t}getTopFreezeSize(){const t=this.getTopFreezeRows();let e=0;for(let i=0;i<t;i++)e+=this.getRowHeight(i);return e}getLeftFreezeRows(){return this._config.freezePane&&this._config.freezePane.left>0?this._config.freezePane.left:0}getLeftFreezeSize(){if(this._config.freezePane&&this._config.freezePane.left>0){let t=0;for(let e=0;e<this._config.freezePane.left;e++)t+=this.getColumnWidth(e);return t}return 0}getBottomFreezeRows(){return this._config.freezePane&&this._config.freezePane.bottom>0?this._config.freezePane.bottom:0}getBottomFreezeSize(){return this._bottomFreezeSize}getColumnWidth(t){return this._columnModel[t]&&void 0!==this._columnModel[t].width?this._columnModel[t].width:this._config.columnWidth}getRowHeight(t){return this._rowModel[t]&&void 0!==this._rowModel[t].height?this._rowModel[t].height:this._config.rowHeight}getTotalWidth(){return this._totalWidth}getTotalHeight(){return this._totalHeight}getRowModel(t){if(this.isHeaderRow(t))return this._headerRowModel[t];{const e=t-this._config.headerRowCount;return this._rowModel[e]}}getColumnModel(t){return this._columnModel[t]}getCellModel(t,e){if(this.isHeaderRow(t)){if(this._headerCellModel[e])return this._headerCellModel[e][t]}else{const i=t-this._config.headerRowCount;if(this._cellModel[e])return this._cellModel[e][i]}}getCascadedCellProp(t,e,i){const s=this.getCellModel(t,e);if(s&&s[i])return s[i];const n=this.getRowModel(t);if(n&&n[i])return n[i];const o=this.getColumnModel(e);return o&&o[i]?o[i]:void 0}getCellClasses(t,e){let i=[];const s=this.getColumnModel(e);s&&s.cssClass&&i.unshift(s.cssClass);const n=this.isHeaderRow(t),o=this.getRowModel(t);o&&(n&&i.unshift("pgrid-row-header"),o.cssClass&&i.unshift(o.cssClass));const r=this.getCellModel(t,e);return r&&r.cssClass&&i.unshift(r.cssClass),i}determineScrollbarState(t,e,i){let s=this._totalWidth>t,n=this._totalHeight>e;return s&&!n?n=this._totalHeight>e-i:!s&&n&&(s=this._totalWidth>t-i),s&&n?"b":!s&&n?"v":s&&!n?"h":"n"}getDataAt(t,e){if(this.isHeaderRow(t)){const t=this.getColumnModel(e);return t&&t.title?t.title:void 0}{const i=t-this._config.headerRowCount,s=this.getColumnModel(e);return s&&s.field?this._data.getDataAt(i,s.field):void 0}}getRowDataAt(t){if(!this.isHeaderRow(t)){const e=t-this._config.headerRowCount;return this._data.getRowDataAt(e)}}setDataAt(t,e,i){const s=t-this._config.headerRowCount,n=this.getColumnModel(e);n&&n.field&&this._data.setDataAt(s,n.field,i)}getRowIndex(t){return this._config.headerRowCount+this._data.getRowIndex(t)}getRowId(t){return t>=this._config.headerRowCount?this._data.getRowId(t-this._config.headerRowCount):null}getColumnIndex(t){for(let e=0;e<this._config.columns.length;e++)if(this._config.columns[e].field===t)return e;return-1}getColumnField(t){if(this._config.columns[t])return this._config.columns[t].field}calcTotalSize(){this._calcTotalWidth(),this._calcTotalHeight(),this._calcBottomFreezeSize()}_calcTotalWidth(){this._totalWidth=0;for(let t=0;t<this._columnModel.length;t++)void 0!==this._columnModel[t].width?this._totalWidth+=this._columnModel[t].width:this._totalWidth+=this._config.columnWidth}_calcTotalHeight(){let t=Object.keys(this._headerRowModel);this._totalHeight=this._config.rowHeight*(this._config.headerRowCount-t.length);for(let t in this._headerRowModel)void 0!==this._headerRowModel[t].height?this._totalHeight+=this._headerRowModel[t].height:this._totalHeight+=this._config.rowHeight;let e=Object.keys(this._rowModel);this._totalHeight+=this._config.rowHeight*(this._data.getRowCount()-e.length);for(let t in this._rowModel)void 0!==this._rowModel[t].height?this._totalHeight+=this._rowModel[t].height:this._totalHeight+=this._config.rowHeight}_calcBottomFreezeSize(){if(this._config.freezePane&&this._config.freezePane.bottom>0){let t=0;for(let e=0;e<this._config.freezePane.bottom;e++)t+=this.getRowHeight(this._config.rowCount-1-e);this._bottomFreezeSize=t}else this._bottomFreezeSize=0}}const H="dataChanged";class L extends s{constructor(t,e){super(),this._extension=e,this._idRunner=0,this._rid=[],this._rowMap={},this._data=[],this._blockEvent=!1,this._processedEvent=[],this._transformedRid=[],this._searchQuery=null,this._searchFields=null;let{format:i,data:s,fields:n}=t;if(i||(i="rows"),this._dataFormat=i,this._fields=n,Array.isArray(s))for(let t=0;t<s.length;t++)this.addRow(s[t]);else this._data=[]}getRowCount(){return this._transformedRid.length}getAllData(){return this._data}getData(t,e){let i=this._rowMap[t];if(i)return i[e]}getDataAt(t,e){let i=this._transformedRid[t];if(i){let t=this._rowMap[i];if(t)return t[e]}}getRowData(t){return this._rowMap[t]}getRowDataAt(t){let e=this._transformedRid[t];if(e)return this._rowMap[e]}getRowIndex(t){return this._transformedRid.indexOf(t)}getRowId(t){return this._transformedRid[t]}setData(t,e,i){let s=this._rowMap[t];if(s&&s[e]===i)return;const n={changeType:"fieldChange",rowId:t,field:e,data:i,cancel:!1};this._processedEvent.push(n);let o=!1;if(this._blockEvent?o=!0:(this._blockEvent=!0,this._extension.executeExtension("dataBeforeUpdate",n),this._blockEvent=!1),n.cancel||s&&(s[e]=n.data,this._blockEvent||(this._blockEvent=!0,this._extension.executeExtension("dataAfterUpdate",n),this._blockEvent=!1)),!o){let t={updates:this._processedEvent};this._extension.executeExtension("dataFinishUpdate",t),setTimeout(()=>{this.dispatch(H,t)},100),this._processedEvent=[]}}setDataAt(t,e,i){const s=this._transformedRid[t];void 0!==s&&this.setData(s,e,i)}addRow(t){const e=this.getRowCount();this.insertRow(e,t)}insertRow(t,e){let i=null,s=!1;if("rows"===this._dataFormat)i=this._generateRowId(),this._rid.splice(t,0,i),this._rowMap[i]=e,this._data.splice(t,0,e),s=!0;else if("array"===this._dataFormat&&Array.isArray(this._fields)){i=this._generateRowId(),this._rid.splice(t,0,i);let n=this._createObject(e,this._fields);this._rowMap[i]=n,this._data.splice(t,0,n),s=!0}if(s){const t={updates:[{changeType:"rowAdded",rowId:i,data:this.getRowData(i)}]};this.dispatch(H,t)}this._searchQuery?this.search(this._searchQuery,this._searchFields):this._transformedRid=this._rid.slice()}removeRow(t){let e=this._rowMap[t],i=this._data.indexOf(e),s=this._transformedRid.indexOf(t);this._data.splice(i,1),this._rid.splice(i,1),this._transformedRid.splice(s,1),delete this._rowMap[t];const n={updates:[{changeType:"rowRemoved",rowId:t}]};this.dispatch(H,n)}removeRowAt(t){let e=this.getRowId(t);this.removeRow(e)}removeAllRows(){this._rid=[],this._transformedRid=[],this._rowMap={},this._data=[];const t={updates:[{changeType:"global"}]};setTimeout(()=>{this.dispatch(H,t)},100)}search(t,e){this._searchQuery=t,this._searchFields=e;let i=null;e&&(i=e.reduce((t,e)=>{t[e]=!0},{}));const s=new RegExp(t,"i");this._transformedRid=this._rid.filter(t=>{const e=this._rowMap[t];if(e)for(var n in e)if((!i||i[n])&&e[n]&&s.test(e[n]))return!0});this.dispatch(H,{updates:[{changeType:"global"}]})}clearSearch(){this._transformedRid=this._rid.slice(),this._searchQuery=null,this._searchFields=null;this.dispatch(H,{updates:[{changeType:"global"}]})}_generateRowId(){return this._idRunner++,""+this._idRunner}_createObject(t,e){let i={};for(let s=0;s<e.length;s++)i[e[s]]=t[s];return i}}class T{constructor(t,e){this._grid=t,this._config=e,this._extensions={cellRender:[],cellAfterRender:[],cellUpdate:[],cellAfterUpdate:[],cellEditableCheck:[],keyDown:[],gridAfterRender:[],dataBeforeRender:[],dataBeforeUpdate:[],dataAfterUpdate:[],dataFinishUpdate:[]}}loadExtension(t){t.init&&t.init(this._grid,this._config);for(let e in this._extensions)t[e]&&this._extensions[e].push(t)}hasExtension(t){return this._extensions[t]&&this._extensions[t].length>0}queryExtension(t){return this._extensions[t]?this._extensions[t]:[]}executeExtension(t){this.queryExtension(t).forEach(e=>{e[t].apply(e,Array.prototype.slice.call(arguments,1))})}}class P{constructor(){this._state={}}exists(t){return void 0!==this._state[t]}get(t){return this._state[t]}set(t,e){this._state[t]=e}}class O{static mixin(t,e){for(var i in t)t.hasOwnProperty(i)&&(e[i]=t[i]);return e}}class k{init(t,e){this._grid=t,this._config=e,this._currentSelection=null,this._selectionClass=this._config.selection&&this._config.selection.cssClass?this._config.selection.cssClass:"pgrid-cell-selection"}keyDown(t){if(this._grid.state.get("editing"))return;let e=this._grid.state.get("selection");if(e&&e.length>0){let i=e[0].r,s=e[0].c,n=!0;switch(t.keyCode){case 40:i++,n=!1;break;case 38:i--;break;case 37:s--;break;case 39:case 9:s++;break;default:return}if(i>=0&&i<this._grid.model.getRowCount()&&s>=0&&s<this._grid.model.getColumnCount()){const e=this._grid.model.isHeaderRow(i);if(!this._grid.model.getRowModel(i)||!e){let e=this._grid.view.getCell(i,s);e&&(this._selectCell(e,i,s),this._grid.view.scrollToCell(i,s,n),t.preventDefault(),t.stopPropagation())}}}}cellAfterRender(t){t.cell.addEventListener("mousedown",t=>{const e=t.target,i=parseInt(e.dataset.rowIndex),s=parseInt(e.dataset.colIndex),n=this._grid.model.getRowModel(i),o=this._grid.model.isHeaderRow(i);n&&o||e.classList.contains("pgrid-cell")&&this._selectCell(e,i,s)})}_selectCell(t,e,i){this._currentSelection&&this._currentSelection!==t&&this._currentSelection.classList.remove(this._selectionClass),this._currentSelection=t,this._currentSelection.classList.add(this._selectionClass),this._grid.view.getElement().focus();let s=this._grid.state.get("selection");s||(s=[],this._grid.state.set("selection",s)),s.length=0,s.push({r:e,c:i,w:1,h:1})}}class A{init(t,e){this._grid=t,this._config=e,this._editorAttached=!1,this.scrollHandler=this.scrollHandler.bind(this),this._grid.view.listen("vscroll",this.scrollHandler),this._grid.view.listen("hscroll",this.scrollHandler)}scrollHandler(){this._detachEditor()}keyDown(t){if(!this._editorAttached&&!t.ctrlKey){let e=this._grid.state.get("selection");if(e&&e.length>0){let i=e[0].r,s=e[0].c,n=!1;if((13===t.keyCode||t.keyCode>31&&!(t.keyCode>=37&&t.keyCode<=40))&&(n=!0),n&&i>=0&&i<this._grid.model.getRowCount()&&s>=0&&s<this._grid.model.getColumnCount()){let t=this._grid.view.getCell(i,s);t&&this._editCell(t)}}}}cellAfterRender(t){t.cell.addEventListener("dblclick",t=>{let e=t.target;e&&this._editCell(e)})}_editCell(t){let e=t,i=parseInt(e.dataset.rowIndex),s=parseInt(e.dataset.colIndex);if(this._grid.model.canEdit(i,s)){this._grid.state.set("editing",!0);let n=t.getBoundingClientRect();const o=document.scrollingElement||document.documentElement;let r=o.scrollTop,l=o.scrollLeft;this._editorContainer=document.createElement("div"),this._editorContainer.style.position="absolute",this._editorContainer.style.top=n.top+r+"px",this._editorContainer.style.left=n.left+l+"px",this._editorContainer.style.width=n.width+"px",this._editorContainer.style.height=n.height+"px",document.body.appendChild(this._editorContainer);let h=this._grid.model.getDataAt(i,s),d=this._grid.model.getCascadedCellProp(e.dataset.rowIndex,e.dataset.colIndex,"editor");if(d&&d.attach){let t=this._grid.model.getRowDataAt(i,s),e={cell:this._editorContainer,data:h,dataRow:t,done:this._done.bind(this)};d.attach(e)}else this._attachEditor(this._editorContainer,h,this._done.bind(this));this._editorAttached=!0,this._editingCol=s,this._editingRow=i}}_attachEditor(t,e,i){if(!this._inputElement){let s=t.getBoundingClientRect();this._inputElement=document.createElement("input"),this._inputElement.type="text",this._inputElement.value=e,this._inputElement.style.width=s.width+"px",this._inputElement.style.height=s.height+"px",this._inputElement.className="pgrid-cell-text-editor",t.appendChild(this._inputElement),this._inputElement.focus(),this._inputElement.select(),this._arrowKeyLocked=!1,this._keydownHandler=(t=>{switch(t.keyCode){case 13:this._inputElement&&this._inputElement.removeEventListener("blur",this._blurHandler),i(t.target.value),t.stopPropagation(),t.preventDefault();break;case 27:this._inputElement&&this._inputElement.removeEventListener("blur",this._blurHandler),i(),t.preventDefault(),t.stopPropagation();break;case 40:case 38:case 37:case 39:this._arrowKeyLocked?(t.preventDefault(),t.stopPropagation()):i(t.target.value)}}),this._blurHandler=(t=>{i(t.target.value)}),this._clickHandler=(t=>{this._arrowKeyLocked=!0}),this._inputElement.addEventListener("keydown",this._keydownHandler),this._inputElement.addEventListener("blur",this._blurHandler),this._inputElement.addEventListener("click",this._clickHandler)}}_detachEditor(){this._editorContainer&&(this._editorContainer.parentElement.removeChild(this._editorContainer),this._editorContainer=null,this._inputElement&&(this._inputElement.removeEventListener("keydown",this._keydownHandler),this._inputElement.removeEventListener("blur",this._blurHandler),this._inputElement.removeEventListener("click",this._clickHandler),this._inputElement.parentElement.removeChild(this._inputElement),this._inputElement=null,this._keydownHandler=null,this._blurHandler=null,this._clickHandler=null))}_done(t,e){if(this._detachEditor(),void 0!==t)if(e){let e=this._grid.model.getRowId(this._editingRow);if(e)for(let i in t)t.hasOwnProperty(i)&&this._grid.data.setData(e,i,t[i])}else this._grid.model.setDataAt(this._editingRow,this._editingCol,t);this._grid.view.updateCell(this._editingRow,this._editingCol),this._editingRow=-1,this._editingCol=-1,this._editorAttached=!1,this._grid.state.set("editing",!1),this._grid.view.getElement().focus()}}class z{constructor(){this._globalClipboard=!1}init(t,e){this._grid=t,this._config=e}keyDown(t){if(this._globalClipboard&&t.ctrlKey)if("c"===t.key){let t=this._copy();null!==t&&window.clipboardData.setData("text",t)}else"v"===t.key&&this._paste(window.clipboardData.getData("text"))}gridAfterRender(t){window.clipboardData?this._globalClipboard=!0:(this._grid.view.getElement().addEventListener("paste",t=>{this._paste(t.clipboardData.getData("text"))}),this._grid.view.getElement().addEventListener("copy",t=>{let e=this._copy();null!==e&&(t.clipboardData.setData("text/plain",e),t.preventDefault())}),this._globalClipboard=!1)}_copy(t){let e=this._grid.state.get("selection");if(e&&e.length>0){let t=e[0],i=[];for(let e=0;e<t.h;e++){let s=[];for(let i=0;i<t.w;i++)s.push(this._grid.model.getDataAt(t.r+e,t.c+i));i.push(s.join("\t"))}return i.join("\n")}return null}_paste(t){if(t){t=t.replace(/\n$/g,"");let e=this._grid.state.get("selection");if(e&&e.length>0){let i=e[0],s=t.split("\n");for(let t=0;t<s.length;t++){let e=s[t].split("\t");for(let s=0;s<e.length;s++){let n=i.r+t,o=i.c+s;this._grid.model.canEdit(n,o)&&(this._grid.model.setDataAt(n,o,e[s]),this._grid.view.updateCell(n,o))}}}}}}class D{init(t,e){this._grid=t,this._config=e}dataFinishUpdate(t){let e={},i={};for(let s=0;s<t.updates.length;s++){let{rowId:n,field:o}=t.updates[s],r=null,l=null;e[n]?r=e[n]:(r=this._grid.model.getRowIndex(n),e[n]=r),i[o]?l=i[o]:(l=this._grid.model.getColumnIndex(o),i[n]=l),this._grid.view.updateCell(r,l)}}}class W{init(t,e){this._grid=t,this._config=e}cellRender(t){const e=this._grid.model.getColumnModel(t.colIndex);if(e&&e.formatter&&e.formatter.render){let i=Object.assign({},t);i.colModel=e,i.grid=this._grid,e.formatter.render(i),t.handled=!0}}cellUpdate(t){const e=this._grid.model.getColumnModel(t.colIndex);if(e&&e.formatter&&e.formatter.update){let i=Object.assign({},t);i.colModel=e,i.grid=this._grid,e.formatter.update(i),t.handled=!0}}}window.PGrid=class extends s{constructor(t){super(),this._config=O.mixin(t,{rowCount:0,headerRowCount:1,footerRowCount:0,columnCount:0,rowHeight:32,columnWidth:100}),this._extensions=new T(this,this._config),this._data=new L(this._config.dataModel,this._extensions),this._model=new I(this._config,this._data,this._extensions),this._view=new S(this._model,this._extensions),this._state=new P,this._config.selection&&this._extensions.loadExtension(new k),this._config.editing&&this._extensions.loadExtension(new A),this._config.copypaste&&this._extensions.loadExtension(new z),this._config.autoUpdate&&this._extensions.loadExtension(new D),this._config.columnFormatter&&this._extensions.loadExtension(new W),this._config.extensions&&this._config.extensions.length>0&&this._config.extensions.forEach(t=>{this._extensions.loadExtension(t)})}get view(){return this._view}get model(){return this._model}get data(){return this._data}get extension(){return this._extensions}get state(){return this._state}render(t){this._view.render(t)}},Element.prototype.scrollIntoViewIfNeeded||(Element.prototype.scrollIntoViewIfNeeded=function(t){function e(t,e){return{start:t,length:e,end:t+e}}function i(e,i){return!1===t||i.start<e.end&&e.start<i.end?Math.max(e.end-i.length,Math.min(i.start,e.start)):(e.start+e.end-i.length)/2}function s(t,e){return{x:t,y:e,translate:function(i,n){return s(t+i,e+n)}}}function n(t,e){for(;t;)e=e.translate(t.offsetLeft,t.offsetTop),t=t.offsetParent;return e}for(var o,r=n(this,s(0,0)),l=s(this.offsetWidth,this.offsetHeight),h=this.parentNode;h instanceof HTMLElement;)o=n(h,s(h.clientLeft,h.clientTop)),h.scrollLeft=i(e(r.x-o.x,l.x),e(h.scrollLeft,h.clientWidth)),h.scrollTop=i(e(r.y-o.y,l.y),e(h.scrollTop,h.clientHeight)),r=r.translate(-h.scrollLeft,-h.scrollTop),h=h.parentNode})}]);