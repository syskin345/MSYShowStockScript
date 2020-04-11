// ==UserScript==
// @description Will load stock status on the product list page - make sure to select your store from the drop down.
// @name MSY Show Me Stock
// @namespace sysKin-scripts
// @match https://www.msy.com.au/**
// @match https://msy.com.au/**
// @grant none
// ==/UserScript==

var cache = {};

var selectedShop = localStorage.getItem("shop") || ''; 

function apply(stockStatus, productElement, stockStatusElement) {
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
                apply(stockStatus, productElement, stockStatusElement);
                return;
              }
            }
            let stockStatus = 'Shop missing. Closed? :(';
            cache[selectedShop+addr] = stockStatus;
            apply(stockStatus, productElement, stockStatusElement);            
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
