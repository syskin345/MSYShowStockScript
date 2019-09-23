// ==UserScript==
// @name MSY Show Me Stock
// @namespace Violentmonkey Scripts
// @match https://www.msy.com.au/**
// @grant none
// ==/UserScript==

var cache = {};

var selected = localStorage.getItem("shop") || ''; 

var elementToObserve = document.querySelector(".page-body");


function apply(status, p) {
  let elem = $('<div class="looked-up"></div>').append($.parseHTML(status));
  if (status.indexOf('Low Stock') > 0) elem.css('color', '#660');
  if (status.indexOf('Out of Stock') > 0) {
    p.css('opacity', '33%');
    elem.css('color', 'red');
  }
  if (status.indexOf('In Stock') > 0) elem.css('color', 'green');
  p.append(elem);
}

function doLookup(prod) {
  if (prod.querySelector('.looked-up')) {
    return;
  }

  let p = $(prod);
  p.css('opacity', '');

  if (selected) {
    let addr = p.find('a').attr('href');
    if (addr) {
      let status = cache[selected+addr];
      if (!status) {
        $('<div></div>').load(addr, [], function(ret) {
          let pos = ret.indexOf(selected);
          if (pos == -1) return;
          let pos2 = ret.indexOf('<td', pos);
          let pos3 = ret.indexOf('>', pos2);
          let pos4 = ret.indexOf('</td>', pos3);
          let status2 = ret.substring(pos3+1, pos4);
          cache[selected+addr] = status2;
          apply(status2, p);
        });
      } else {
        apply(status, p);
      }
    }
  }
}

var observer = new MutationObserver(function(records) {

  records.forEach(function(record) {
  
    for (let node of record.addedNodes) {
      if (!node.querySelectorAll) continue;
      for (let prod of node.querySelectorAll('div.product-item')) {
        doLookup(prod);
      }
    }
  });
});
   

observer.observe(elementToObserve, {subtree: true, childList: true});

let shops = [
  'MSY Online', 
  'ACT - Fyshwick', 
  'NSW - Auburn', 
  'NSW - Hurstville', 
  'NSW - Kingsford', 
  'NSW - Mount Pritchard', 
  'NSW - Ultimo', 
  'QLD - Brendale', 
  'QLD - Ipswich/Bundamba', 
  'QLD - Morningside', 
  'QLD - Slacks Creek', 
  'QLD - Varsity Lakes', 
  'SA - Adelaide CBD', 
  'SA - Elizabeth', 
  'SA - Holden Hill', 
  'SA - North Plympton', 
  'SA - Port Adelaide', 
  'TAS - Glenorchy', 
  'VIC - Altona North/Brooklyn', 
  'VIC - Cheltenham',
  'VIC - Clayton',
  'VIC - Dandenong',
  'VIC - Geelong',
  'VIC - Malvern',
  'VIC - Mitcham',
  'VIC - North Melbourne',
  'VIC - Pascoe vale',
  'WA - Balcatta',
  'WA - Cannington'
];

var selector = $('<select style="text-transform: none"><option value="">no stock lookup</option></select>');
shops.forEach(function(shop){
  let opt = $('<option></option>').attr('value', shop).text(shop);
  if (shop === selected) {
    opt.attr('selected', 'selected');
  }
  selector.append(opt);
}); 

$(document.querySelector('.product-sorting')).after(selector);

selector.change(function() {
  selected = selector.val();
  localStorage.setItem("shop", selected)
  $('div.looked-up').detach();
  document.querySelectorAll("div.product-item").forEach(doLookup);
});

document.querySelectorAll("div.product-item").forEach(doLookup);
