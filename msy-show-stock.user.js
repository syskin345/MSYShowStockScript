// ==UserScript==
// @description Will load stock status on the product list page - make sure to select your store from the drop down.
// @name MSY Show Me Stock
// @namespace sysKin-scripts
// @version 1.1.11
// @match https://www.msy.com.au/**
// @match https://msy.com.au/**
// @grant none
// @run-at document-idle
// ==/UserScript==

var cache = {};

var selectedShop = localStorage.getItem("shop") || ''; 

function apply(stockStatus, productElement, stockStatusElement, spinner) {
  spinner.hide();
  stockStatusElement.style['font-weight'] = 'bold';
  stockStatusElement.textContent = stockStatus;
  if (stockStatus.indexOf('Low Stock') >= 0) stockStatusElement.style.color = '#660';
  if (stockStatus.indexOf('Out of Stock') >= 0) {
    productElement.style.opacity = '0.4';
    stockStatusElement.style.color = 'red';
  }
  if (stockStatus.indexOf('In Stock') >= 0) stockStatusElement.style.color = 'green';
}

function doLookup(productElement) {
  if (productElement.querySelector('.stock-status')) {
    return;
  }
  let stockStatusElement = document.createElement('div');
  stockStatusElement.className = 'stock-status';
  stockStatusElement.textContent = '\xa0';
  productElement.appendChild(stockStatusElement);
  productElement.style.opacity = '';

  if (selectedShop) {
    var spinner = new Spinner();
    stockStatusElement.appendChild(spinner.element);
    spinner.show();

    let addr = productElement.querySelector('a').getAttribute('href');
    if (addr) {
      let status = cache[selectedShop+addr];
      if (!status) {
        $.get(addr, function(ret, r) {
          if (r === 'success') {
            let productDocument = new DOMParser().parseFromString(ret, 'text/html');
            for (let shopNameCell of productDocument.querySelectorAll('td.spec-name')) {
              if (shopNameCell.nextElementSibling && shopNameCell.innerText.trim() === selectedShop) {
                let stockStatus = shopNameCell.nextElementSibling.innerText;
                cache[selectedShop+addr] = stockStatus;
                apply(stockStatus, productElement, stockStatusElement, spinner);
                return;
              }
            }
            let stockStatus = 'Shop missing. Closed? :(';
            cache[selectedShop+addr] = stockStatus;
            apply(stockStatus, productElement, stockStatusElement, spinner);
          }
        });
      } else {
        apply(status, productElement, stockStatusElement);
      }
    }
  }
}

var observer = new MutationObserver(function(records) {
  for (let record of records) {
    for (let node of record.addedNodes) {
      if (!node.querySelectorAll) continue;
      for (let prod of node.querySelectorAll('div.product-item')) {
        doLookup(prod);
      }
    }
  }
});
   
var elementToObserve = document.querySelector('.page-body');
if (!elementToObserve) {
  return;
}

observer.observe(elementToObserve, {subtree: true, childList: true});

let shops = [
  'MSY Online', 
  'ACT - Fyshwick', 
  'NSW - Auburn', 
  'NSW - Ultimo', 
  'QLD - Brendale', 
  'QLD - Slacks Creek', 
  'SA - Adelaide CBD', 
  'SA - Holden Hill', 
  'TAS - Glenorchy',
  'VIC - Clayton',
  'VIC - Dandenong',
  'VIC - Mitcham',
  'VIC - Pascoe vale',
  'WA - Balcatta'
];

var selector = $('<select style="text-transform: none"><option value="">no stock lookup</option></select>');
shops.forEach(function(shop){
  let opt = $('<option></option>').attr('value', shop).text(shop);
  if (shop === selectedShop) {
    opt.attr('selected', 'selected');
  }
  selector.append(opt);
}); 

$(document.querySelector('.product-sorting')).after(selector);

selector.before($('<span>Stock lookup</span>'));

selector.change(function() {
  selectedShop = selector.val();
  localStorage.setItem("shop", selectedShop)
  $('div.stock-status').detach();
  document.querySelectorAll('.category-page div.product-item, .search-results div.product-item').forEach(doLookup);
});

document.querySelectorAll('.category-page div.product-item, .search-results div.product-item').forEach(doLookup);





// borrowed from https://github.com/ZulNs/LoadingSpinner.js under MIT license
function Spinner() {
  let element = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
	this.element=element;
	let c=document.createElementNS('http://www.w3.org/2000/svg', 'circle');
	element.setAttribute('width','24');
	element.setAttribute('height','24');
	c.setAttribute('viewBox','0 0 24 24');
	c.setAttribute('cx','12');
	c.setAttribute('cy','12');
	c.setAttribute('r','10');
	c.setAttribute('stroke-width','3');
	c.setAttribute('stroke','#8cf');
	c.setAttribute('fill','transparent');
	element.appendChild(c);
  element.style['margin-top'] = '-20px';
  var id = null;

  this.show=function() {
    const c=64,m=35;
    element.style.display='inline';
    move1();
    function move1() {
      let i=0,o=0;
      move();
      function move() {
        if(i==c)move2();
        else{
          i+=1;o+=2;
          element.setAttribute('stroke-dasharray',i+' '+(c-i));
          element.setAttribute('stroke-dashoffset',o);
          id=setTimeout(move,m);
        }
      }
    }
    function move2() {
      let i=c,o=c*2;
      move();
      function move() {
        if(i==0)move1();
        else{
          i-=1;o+=1;
          element.setAttribute('stroke-dasharray',i+' '+(c-i));
          element.setAttribute('stroke-dashoffset',o);
          id=setTimeout(move,m);
        }
      }
    }
  };
  this.hide=function() {
    element.style.display='none';
    if(id){
      clearTimeout(id);
      id=null;
    }
    element.setAttribute('stroke-dasharray','0 264');
    element.setAttribute('stroke-dashoffset','0');
  };
}
