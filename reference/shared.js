/**
 * shared.js
 * Single reference file for all shared logic:
 *   - MATERIAL_CONFIG  (fabric categories, fields, autocomplete)
 *   - HW_MATERIALS     (hardware component definitions)
 *   - Date validation & workday arithmetic
 *   - Tier calculation engine
 *   - PDF state embedding (via PDF-lib CDN)
 *   - PDF state extraction from uploaded file
 *   - localStorage helpers
 *
 * Requires PDF-lib to be loaded before this script:
 *   <script src="https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js"></script>
 */

/* =================================================================
   MATERIAL CONFIG
   Fabric/cover category definitions used by the planner form.
================================================================= */
var MATERIAL_CONFIG = {

  interiorFunctions: ['Liner', 'Panels', 'Pockets', 'CC Slot', 'Pen Loop'],

  categories: [
    'Bookcloth', 'Linen/Paper', 'Wood', 'Rockboard', 'Metal',
    'Leather', 'Acrylic', 'Carbonite', '4C Litho', 'Other'
  ],

  fields: {
    Bookcloth: {
      interior: true,
      printTemplate: function(v) { return [v.vendor, v.productLine, v.color, v.decoration].filter(Boolean).join(' '); },
      inputs: [
        { id: 'vendor',      placeholder: 'Vendor',       autocomplete: ['Majilite', 'LBS', 'Fifield', 'KFL Synt3'] },
        { id: 'productLine', placeholder: 'Product Line' },
        { id: 'color',       placeholder: 'Color' },
        { id: 'decoration',  placeholder: 'Decoration',   type: 'decoration' }
      ]
    },
    'Linen/Paper': {
      interior: true,
      printTemplate: function(v) { return [v.vendor, v.productLine, v.color].filter(Boolean).join(' '); },
      inputs: [
        { id: 'vendor',      placeholder: 'Vendor', autocomplete: ['Holliston','LBS','Neenah','Pointe International','PVC Tech','Koroseal','Wolf Gordon'] },
        { id: 'productLine', placeholder: 'Product Line' },
        { id: 'color',       placeholder: 'Color' }
      ]
    },
    Wood: {
      interior: false,
      printTemplate: function(v) { var s = v.type || ''; if (v.finish) s += ' — finish: ' + v.finish; return s; },
      inputs: [
        { id: 'type',   placeholder: 'Type',   autocomplete: ['Russian Birch','Bamboo','Oak','Other'] },
        { id: 'finish', placeholder: 'Finish' }
      ]
    },
    Rockboard: {
      interior: false,
      printTemplate: function(v) { return v.color || ''; },
      inputs: [
        { id: 'color', placeholder: 'Color', autocomplete: [
          'Ash','Begonia','Black','Blue Brush','Breeze','Brown','Bullion','Carribean','Cherry',
          'Covered Bridge','Croquet','Dino','Grey Brush','Grey Linen','Himalayan','Lathe','Maple',
          'Midnight','Ocean','Pavement','Pineapple','Red','RedTrexx','Scworill','Slate','Stainless',
          'Storm','Tan','Thickett','Timber','Tuscan Marble','Walnut','White Speckle','White White','Yellow'
        ]}
      ]
    },
    Metal: {
      interior: false,
      printTemplate: function(v) { var s = v.type || ''; if (v.finish) s += ' — finish: ' + v.finish; return s; },
      inputs: [
        { id: 'type',   placeholder: 'Type',   autocomplete: ['Aluminum','Copper','Brass'] },
        { id: 'finish', placeholder: 'Finish', autocomplete: ['Plain','Brushed','Regular Dip','Dip with Patina'] }
      ]
    },
    Leather: {
      interior: false,
      printTemplate: function(v) { return [v.productLine, v.weight, v.color, v.id].filter(Boolean).join(' '); },
      inputs: [
        { id: 'productLine', placeholder: 'Product Line', autocomplete: [
          'Water Buffalo','Matte Chrome Tanned Water Buffalo','Chrome Tanned Water Buffalo',
          'Bridle','Western Crunch','Oil Tan','Pioneer Chrome Tan','Mellowtan','Roughman','Napa Excel'
        ]},
        { id: 'weight', placeholder: 'Weight', autocomplete: ['2/3 oz.','3/4 oz.','4/5 oz.','5/6 oz.','6/7 oz.','8/9 oz.','9/10 oz.'] },
        { id: 'color',  placeholder: 'Color' },
        { id: 'id',     placeholder: 'ID' }
      ]
    },
    Acrylic: {
      interior: false,
      printTemplate: function(v) { return [v.type, v.color].filter(Boolean).join(' '); },
      inputs: [
        { id: 'type',  placeholder: 'Type' },
        { id: 'color', placeholder: 'Color' }
      ]
    },
    Carbonite: {
      interior: false,
      printTemplate: function(v) { return [v.carbonite]; },
      inputs: [{ id: 'carbonite', placeholder: 'Carbonite' }]
    },
    '4C Litho': {
      interior: true,
      printTemplate: function(v) { return [v.type, v.finish].filter(Boolean).join(' / '); },
      inputs: [
        { id: 'type',   placeholder: 'Type' },
        { id: 'finish', placeholder: 'Finish' }
      ]
    },
    Other: {
      interior: true,
      printTemplate: function(v) { return [v.other]; },
      inputs: [{ id: 'other', placeholder: 'Describe the Material' }]
    }
  }
};

/* =================================================================
   CONSTANTS
================================================================= */
var TIER_INFO = {
  1: { label: 'TIER 1 — FAST TRACK', days: 15,  cls: 't1' },
  2: { label: 'TIER 2 — STANDARD',   days: 25,  cls: 't2' },
  3: { label: 'TIER 3 — COMPLEX',    days: 40,  cls: 't3' },
  4: { label: 'TIER 4 — TBD',        days: null, cls: 't4' }
};

var HW_MATERIALS = [
  { id: 'magnets',         label: 'Magnets',               fields: [{ ph: 'Qty', w: 55 }, { ph: 'Color / Style', w: 120 }, { ph: 'Size', w: 80 }] },
  { id: 'elastic-cords',   label: 'Elastic Cords / Loops', fields: [{ ph: 'Qty', w: 55 }, { ph: 'Color / Style', w: 120 }, { ph: 'Size', w: 80 }] },
  { id: 'eyelets',         label: 'Eyelets',               fields: [{ ph: 'Qty', w: 55 }, { ph: 'Size', w: 80 }, { ph: 'Color', w: 90 }] },
  { id: 'o-rings',         label: 'O-Rings',               fields: [{ ph: 'Qty', w: 55 }, { ph: 'Description', w: 200 }] },
  { id: 'ring-binder',     label: 'Ring Binder',           fields: [{ ph: 'Qty', w: 50 }, { ph: '# of Rings', w: 80 }, { ph: 'Color', w: 90 }, { ph: 'Description / Size', w: 130 }] },
  { id: 'bands',           label: 'Bands',                 fields: [{ ph: 'Qty', w: 55 }, { ph: 'Size', w: 80 }, { ph: 'Color', w: 90 }] },
  { id: 'clips',           label: 'Clips',                 fields: [{ ph: 'Qty', w: 55 }, { ph: 'Color', w: 90 }] },
  { id: 'romark',          label: 'Romark',                fields: [{ ph: 'Sheet Qty', w: 70 }, { ph: 'Size', w: 80 }, { ph: 'Color', w: 90 }, { ph: 'Thickness', w: 90 }] },
  { id: 'rivets',          label: 'Rivets',                fields: [{ ph: 'Qty', w: 55 }] },
  { id: 'plastic-sleeves', label: 'Plastic Sleeves',       fields: [{ ph: 'Qty', w: 55 }, { ph: 'Type / Size', w: 140 }] },
  { id: 'snaps',           label: 'Snaps',                 fields: [{ ph: 'Qty', w: 55 }, { ph: 'Line', w: 80 }, { ph: 'Type', w: 100 }] },
  { id: 'screw-posts',     label: 'Screw Posts',           fields: [{ ph: 'Qty', w: 55 }, { ph: 'Color', w: 90 }, { ph: 'Size', w: 80 }] },
  { id: 'custom-hardware', label: 'Custom Hardware',       fields: [{ ph: 'Qty', w: 55 }, { ph: 'Description', w: 220 }] }
];

var STATUS_OPTS =
  '<option value="in-house">In-house and available</option>' +
  '<option value="ordered-in-stock">Ordered — in-stock at vendor</option>' +
  '<option value="not-in-stock">Ordered — NOT yet in-stock</option>';

/* Embedded attachment filename used inside the PDF */
var PDF_STATE_FILENAME = 'pp-state.json';

/* =================================================================
   DATE HELPERS
================================================================= */
function validateDate(input) {
  var val = input.value.trim();
  if (!val) { input.classList.remove('date-invalid'); input.title = ''; return true; }
  var ok = /^(0?[1-9]|1[0-2])\/(0?[1-9]|[12]\d|3[01])\/\d{4}$/.test(val);
  input.classList.toggle('date-invalid', !ok);
  input.title = ok ? '' : 'Use MM/DD/YYYY format';
  return ok;
}

function addWorkdays(dateStr, numDays) {
  var m = dateStr.match(/^(0?[1-9]|1[0-2])\/(0?[1-9]|[12]\d|3[01])\/(\d{4})$/);
  if (!m) return '';
  var d = new Date(parseInt(m[3]), parseInt(m[1]) - 1, parseInt(m[2]));
  if (isNaN(d.getTime())) return '';
  var added = 0;
  while (added < numDays) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) added++;
  }
  var mo = d.getMonth() + 1, dy = d.getDate(), yr = d.getFullYear();
  return (mo < 10 ? '0' + mo : mo) + '/' + (dy < 10 ? '0' + dy : dy) + '/' + yr;
}

function todayString() {
  var t = new Date();
  var mo = t.getMonth() + 1, dy = t.getDate(), yr = t.getFullYear();
  return (mo < 10 ? '0' + mo : mo) + '/' + (dy < 10 ? '0' + dy : dy) + '/' + yr;
}

/* =================================================================
   TIER CALCULATION
   mode: 'planner' | 'coordinator'
   state: the collectState() object
================================================================= */
function determineTierFromState(state, mode) {
  var reasons = [], tier = 1;
  function escalate(n, txt) { if (n > tier) tier = n; reasons.push({ level: n, text: txt }); }

  var qty = parseInt(state.orderQty) || 0;
  if      (qty > 1000) escalate(4, 'Quantity (' + qty + ') exceeds 1,000');
  else if (qty > 250)  escalate(3, 'Quantity (' + qty + ') exceeds 250');
  else if (qty > 100)  escalate(2, 'Quantity (' + qty + ') exceeds 100');

  /* Material availability — only in coordinator mode */
  if (mode === 'coordinator') {
    if (state.leatherInclude) {
      var ls = state.leatherStatus || 'in-house';
      if      (ls === 'not-in-stock')     escalate(4, 'Leather: ordered, NOT yet in-stock');
      else if (ls === 'ordered-in-stock') escalate(2, 'Leather: ordered (in-stock at vendor)');
    }
    if (state.fabric && state.fabric.include) {
      var fs = state.fabric.status || 'in-house';
      if      (fs === 'not-in-stock')     escalate(4, 'Fabric: ordered, NOT yet in-stock');
      else if (fs === 'ordered-in-stock') escalate(2, 'Fabric: ordered (in-stock at vendor)');
    }
    (state.hardware || []).forEach(function(hw) {
      if (!hw.active) return;
      var hs = hw.status || 'in-house';
      var mat = HW_MATERIALS.find(function(m) { return m.id === hw.id; });
      var lbl = mat ? mat.label : hw.id;
      if      (hs === 'not-in-stock')     escalate(4, lbl + ': ordered, NOT yet in-stock');
      else if (hs === 'ordered-in-stock') escalate(2, lbl + ': ordered (in-stock at vendor)');
    });
  }

  /* Departments */
  var d = state.depts || {};
  if (d.flatbed)  escalate(3, 'Flatbed Print required');
  if (d.woodshop) escalate(3, 'Wood Shop required');
  if (d.offset)   escalate(2, 'Offset Print required');
  if (d.sewing)   escalate(2, 'Sewing required');
  if (d.metal) {
    if (mode === 'coordinator' && state.metalTippin) escalate(2, 'Metal Shop — Tippin Only');
    else if (mode === 'coordinator')                 escalate(3, 'Metal Shop — Full');
    else                                             escalate(3, 'Metal Shop required (scope TBD by Coordinator)');
  }

  /* Interior */
  var ic = state.interior || {};
  if (ic.cbInclude) {
    if (ic.cbPanels === '5+')      escalate(3, 'Corner boards: 5+ panels');
    if (ic.cbType   === 'nonstd')  escalate(3, 'Non-standard corner boards');
  }
  if (ic.pocketsInclude) {
    if (ic.pocketsType === 'nonstd') escalate(3, 'Non-standard pockets');
  }

  return { tier: tier, reasons: reasons };
}

/* =================================================================
   CHECKLIST BUILDER
   Returns array of items that need coordinator follow-up:
   ordered materials, items needing staging/pulling, etc.
================================================================= */
function buildChecklist(state) {
  var items = [];

  /* Leather */
  if (state.leatherInclude) {
    var ls = state.leatherStatus || 'in-house';
    if (ls === 'not-in-stock' || ls === 'ordered-in-stock') {
      items.push({ id: 'leather', label: 'Leather', status: ls, arrived: false });
    } else {
      items.push({ id: 'leather', label: 'Leather — stage / pull', status: 'in-house', arrived: false });
    }
  }

  /* Fabric */
  if (state.fabric && state.fabric.include) {
    var fs  = state.fabric.status || 'in-house';
    var fab = state.fabric;
    var fabLabel = 'Fabric' + (fab.category ? ' — ' + fab.category : '');
    if (fs === 'not-in-stock' || fs === 'ordered-in-stock') {
      items.push({ id: 'fabric', label: fabLabel, status: fs, arrived: false });
    } else {
      items.push({ id: 'fabric', label: fabLabel + ' — stage / pull', status: 'in-house', arrived: false });
    }
  }

  /* Hardware */
  (state.hardware || []).forEach(function(hw) {
    if (!hw.active) return;
    var mat = HW_MATERIALS.find(function(m) { return m.id === hw.id; });
    var lbl = mat ? mat.label : hw.id;
    var hs  = hw.status || 'in-house';
    if (hs === 'not-in-stock' || hs === 'ordered-in-stock') {
      items.push({ id: 'hw-' + hw.id, label: lbl, status: hs, arrived: false });
    } else {
      items.push({ id: 'hw-' + hw.id, label: lbl + ' — stage / pull', status: 'in-house', arrived: false });
    }
  });

  /* Departments — mark as needing completion */
  var d = state.depts || {};
  var deptNames = {
    deboss:   'Deboss',
    offset:   'Offset Print',
    flatbed:  'Flatbed Print',
    sewing:   'Sewing',
    woodshop: 'Wood Shop',
    metal:    'Metal Shop'
  };
  Object.keys(deptNames).forEach(function(k) {
    if (d[k]) items.push({ id: 'dept-' + k, label: deptNames[k] + ' — schedule & confirm', status: 'dept', arrived: false });
  });

  /* Interior components */
  var ic = state.interior || {};
  if (ic.cbInclude)      items.push({ id: 'int-cb',      label: 'Black Corner Boards — stage / pull', status: 'in-house', arrived: false });
  if (ic.pocketsInclude) items.push({ id: 'int-pockets', label: 'Pockets — stage / pull',             status: 'in-house', arrived: false });
  if (ic.tabsInclude)    items.push({ id: 'int-tabs',    label: 'Tabs — stage / pull',                status: 'in-house', arrived: false });

  return items;
}

/* =================================================================
   PDF STATE EMBEDDING
   Generates a formatted PDF and embeds the state JSON as an attachment.
   Returns a Promise that resolves with the PDF bytes (Uint8Array).
================================================================= */
async function embedStatePDF(state, pdfType) {
  /* pdfType: 'planned' | 'reviewed' | 'approved' */
  var { PDFDocument, rgb, StandardFonts, PDFName, PDFString } = PDFLib;

  var pdfDoc = await PDFDocument.create();
  var page   = pdfDoc.addPage([792, 1224]); /* 11 × 17 at 72dpi */
  var { width, height } = page.getSize();

  var fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  var fontReg  = await pdfDoc.embedFont(StandardFonts.Helvetica);

  /* ── Color palette ── */
  var gold     = rgb(0.788, 0.631, 0.173);
  var inkColor = rgb(0.149, 0.149, 0.149);
  var grayBg   = rgb(0.941, 0.941, 0.941);
  var greenBg  = rgb(0.102, 0.420, 0.235);
  var yellowBg = rgb(0.478, 0.396, 0.0);
  var white    = rgb(1, 1, 1);
  var lightGray = rgb(0.85, 0.85, 0.85);

  var pad = 36;
  var y   = height;

  /* ── Banner ── */
  var bannerColors = {
    planned:  { bg: rgb(0.376, 0.376, 0.376), text: 'STEP 1 — PLANNED  |  Material Planner' },
    reviewed: { bg: rgb(0.102, 0.420, 0.235), text: 'STEP 2 — REVIEWED  |  Coordinator Availability Assessment' },
    approved: { bg: rgb(0.153, 0.502, 0.671), text: 'APPROVED — Authorized for Production' }
  };
  var banner = bannerColors[pdfType] || bannerColors.planned;
  page.drawRectangle({ x: 0, y: height - 28, width: width, height: 28, color: banner.bg });
  page.drawText(banner.text, { x: pad, y: height - 20, size: 9, font: fontBold, color: white });

  y = height - 28;

  /* ── Gold title bar ── */
  page.drawRectangle({ x: 0, y: y - 56, width: width, height: 56, color: gold });
  page.drawText('PREPRODUCTION MATERIALS LIST', { x: pad, y: y - 24, size: 18, font: fontBold, color: white });
  page.drawText('Job Order #: ' + (state.jobOrder || '______'), { x: pad, y: y - 42, size: 10, font: fontReg, color: white });
  page.drawText('Order Qty: ' + (state.orderQty || '—'), { x: 220, y: y - 42, size: 10, font: fontReg, color: white });
  page.drawText('Date Received: ' + (state.dateReceived || '—'), { x: 350, y: y - 42, size: 10, font: fontReg, color: white });
  page.drawText('Due Date: ' + (state.dueDateCalc || '—'), { x: 550, y: y - 42, size: 10, font: fontReg, color: white });
  y -= 56;

  /* ── Tier badge ── */
  var tierColors = { t1: rgb(0.153, 0.682, 0.376), t2: rgb(0.141, 0.443, 0.639), t3: rgb(0.627, 0.502, 0.0), t4: rgb(0.753, 0.224, 0.169) };
  var ti = TIER_INFO[state.tierCalc] || TIER_INFO[1];
  var tc = tierColors[ti.cls] || tierColors.t1;
  page.drawRectangle({ x: pad, y: y - 38, width: width - pad * 2, height: 38, color: rgb(0.97, 0.97, 0.97), borderColor: tc, borderWidth: 1.5 });
  page.drawText(ti.label, { x: pad + 10, y: y - 18, size: 13, font: fontBold, color: tc });
  page.drawText(ti.days ? ti.days + ' work days' : 'To be determined', { x: pad + 10, y: y - 32, size: 9, font: fontReg, color: tc });
  y -= 46;

  /* ── Section helper ── */
  function sectionHeader(label, step, bgColor) {
    y -= 6;
    page.drawRectangle({ x: 0, y: y - 18, width: width, height: 18, color: bgColor || lightGray });
    page.drawText(label.toUpperCase(), { x: pad, y: y - 13, size: 8, font: fontBold, color: inkColor });
    if (step) page.drawText(step, { x: width - pad - fontBold.widthOfTextAtSize(step, 7), y: y - 13, size: 7, font: fontBold, color: inkColor });
    y -= 22;
  }

  function row(label, value, labelColor, valueColor) {
    if (y < 60) return; /* Basic overflow guard */
    page.drawText(label, { x: pad + 4, y: y, size: 9, font: fontBold, color: labelColor || inkColor });
    if (value) page.drawText(String(value), { x: 220, y: y, size: 9, font: fontReg, color: valueColor || inkColor });
    y -= 14;
  }

  function subRow(label, value) {
    if (y < 60) return;
    page.drawText(label, { x: pad + 16, y: y, size: 8, font: fontReg, color: rgb(0.3, 0.3, 0.3) });
    if (value) page.drawText(String(value), { x: 220, y: y, size: 8, font: fontReg, color: inkColor });
    y -= 12;
  }

  /* ── Cover materials ── */
  sectionHeader('Cover Materials', 'Step 1 — specs  |  Step 2 — availability');

  if (state.leatherInclude) {
    row('Leather', '', inkColor);
    if (state.leatherStatus && pdfType !== 'planned') {
      subRow('Availability:', state.leatherStatus === 'in-house' ? 'In-house and available' : state.leatherStatus === 'ordered-in-stock' ? 'Ordered — in-stock at vendor' : 'Ordered — NOT yet in-stock');
    }
  }

  var fab = state.fabric || {};
  if (fab.include) {
    row('Fabric / Cover Material', '', inkColor);
    if (fab.category) subRow('Type:', fab.category);
    if (fab.family)   subRow('Family:', fab.family);
    if (fab.qty)      subRow('Qty:', fab.qty + (fab.unit ? ' ' + fab.unit : ''));
    /* Dynamic fields */
    if (fab.fields) {
      Object.keys(fab.fields).forEach(function(k) {
        if (fab.fields[k]) subRow(k + ':', fab.fields[k]);
      });
    }
    if (fab.status && pdfType !== 'planned') {
      subRow('Availability:', fab.status === 'in-house' ? 'In-house and available' : fab.status === 'ordered-in-stock' ? 'Ordered — in-stock at vendor' : 'Ordered — NOT yet in-stock');
      if ((fab.status === 'ordered-in-stock' || fab.status === 'not-in-stock') && fab.dateOrdered) subRow('Date Ordered:', fab.dateOrdered);
      if ((fab.status === 'ordered-in-stock' || fab.status === 'not-in-stock') && fab.po)          subRow('PO #:', fab.po);
    }
  }

  /* ── Hardware ── */
  var activeHw = (state.hardware || []).filter(function(h) { return h.active; });
  if (activeHw.length > 0) {
    sectionHeader('Hardware & Components', 'Step 1 — qty & specs  |  Step 2 — availability');
    activeHw.forEach(function(hw) {
      var mat = HW_MATERIALS.find(function(m) { return m.id === hw.id; });
      var lbl = mat ? mat.label : hw.id;
      var detail = (hw.fields || []).filter(Boolean).join('  ·  ');
      row(lbl, detail || '');
      if (hw.status && pdfType !== 'planned') {
        var statusLabel = hw.status === 'in-house' ? 'In-house and available' : hw.status === 'ordered-in-stock' ? 'Ordered — in-stock at vendor' : 'Ordered — NOT yet in-stock';
        subRow('Availability:', statusLabel);
      }
    });
  }

  /* ── Departments ── */
  var d = state.depts || {};
  var activeDepts = Object.keys(d).filter(function(k) { return d[k]; });
  if (activeDepts.length > 0) {
    sectionHeader('Production Departments', 'Step 1 — needed  |  Step 2 — completed');
    var deptNames = { deboss: 'Deboss', offset: 'Offset Print', flatbed: 'Flatbed Print', sewing: 'Sewing', woodshop: 'Wood Shop', metal: 'Metal Shop' };
    activeDepts.forEach(function(k) {
      var extra = (k === 'metal' && state.metalTippin) ? '  (Tippin Only)' : '';
      var deptCompleted = state.deptsCompleted && state.deptsCompleted[k];
      row(deptNames[k] + extra, pdfType !== 'planned' ? (deptCompleted ? '✓ Completed' : 'Pending') : '');
    });
  }

  /* ── Interior ── */
  var ic = state.interior || {};
  var hasInterior = ic.cbInclude || ic.pocketsInclude || ic.tabsInclude;
  if (hasInterior) {
    sectionHeader('Interior Components', 'Step 1');
    if (ic.cbInclude) {
      row('Black Corner Boards', (ic.cbPanels ? ic.cbPanels + ' panels' : '') + (ic.cbType ? '  ·  ' + (ic.cbType === 'nonstd' ? 'Non-Standard' : 'Standard') : ''));
    }
    if (ic.pocketsInclude) row('Pockets', ic.pocketsType === 'nonstd' ? 'Non-Standard' : 'Standard');
    if (ic.tabsInclude)    row('Tabs', '');
  }

  /* ── Notes ── */
  if (state.notes) {
    sectionHeader('Notes', 'Step 1');
    /* Word-wrap notes manually */
    var words = state.notes.split(' ');
    var line  = '', maxW = width - pad * 2 - 8;
    words.forEach(function(w) {
      var test = line ? line + ' ' + w : w;
      if (fontReg.widthOfTextAtSize(test, 9) > maxW) {
        if (y > 60) { page.drawText(line, { x: pad + 4, y: y, size: 9, font: fontReg, color: inkColor }); y -= 12; }
        line = w;
      } else {
        line = test;
      }
    });
    if (line && y > 60) { page.drawText(line, { x: pad + 4, y: y, size: 9, font: fontReg, color: inkColor }); y -= 14; }
  }

  /* ── Sign-off (approved only) ── */
  if (pdfType === 'approved' && state.signoff) {
    sectionHeader('Sign-Off', 'Step 2 — Coordinator', rgb(0.714, 0.886, 0.776));
    row('Material Handler:', state.signoff.name || '');
    row('Date:', state.signoff.date || '');
    y -= 6;
    page.drawRectangle({ x: pad, y: y - 22, width: width - pad * 2, height: 22, color: rgb(0.914, 0.973, 0.933), borderColor: rgb(0.714, 0.886, 0.776), borderWidth: 1 });
    page.drawText('ALL ORDER COMPONENTS IN-HOUSE — AUTHORIZED FOR PRODUCTION', { x: pad + 10, y: y - 15, size: 9, font: fontBold, color: rgb(0.102, 0.420, 0.235) });
    y -= 28;
  }

  /* ── Store state JSON in the PDF info dictionary (Subject field).
       The info dict is never compressed, so it reads back cleanly
       with pdfDoc.getSubject() regardless of PDF-lib version.      ── */
  var jsonStr = JSON.stringify(state);
  pdfDoc.setSubject('pp-state:' + jsonStr);

  /* Also store as a visible attachment for PDF-viewer convenience,
     but extraction does NOT depend on this. */
  try {
    var jsonBytes = new TextEncoder().encode(jsonStr);
    await pdfDoc.attach(jsonBytes, PDF_STATE_FILENAME, {
      mimeType:    'application/json',
      description: 'Preproduction form state',
      creationDate: new Date(),
      modificationDate: new Date()
    });
  } catch(e) { /* Non-critical — attachment is optional */ }

  return await pdfDoc.save();
}

/* =================================================================
   PDF STATE EXTRACTION
   Reads the state JSON stored in the PDF info dictionary Subject field.
   Returns a Promise that resolves with the parsed state object,
   or rejects if no valid state is found.

   Strategy:
     1. pdfDoc.getSubject() — primary. Info dict is never compressed.
     2. Raw-byte scan for the pp-state: marker in the PDF bytes
        — handles edge cases where pdf-lib's getSubject() fails.
================================================================= */
async function extractStateFromPDF(file) {
  var { PDFDocument } = PDFLib;
  var arrayBuffer = await file.arrayBuffer();

  /* ── Strategy 1: PDF info dictionary Subject field (never compressed) ── */
  try {
    var pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    var subject = pdfDoc.getSubject();
    if (subject && subject.startsWith('pp-state:')) {
      return JSON.parse(subject.slice(9));
    }
  } catch (e1) {
    console.warn('Subject field read failed:', e1.message);
  }

  /* ── Strategy 2: raw-byte scan for the pp-state: marker ── */
  /* The Subject value is stored uncompressed in the PDF info dict */
  var raw         = new Uint8Array(arrayBuffer);
  var markerStr   = 'pp-state:{"version":';
  var markerBytes = new TextEncoder().encode(markerStr);

  for (var pos = 0; pos <= raw.length - markerBytes.length; pos++) {
    var found = true;
    for (var m = 0; m < markerBytes.length; m++) {
      if (raw[pos + m] !== markerBytes[m]) { found = false; break; }
    }
    if (!found) continue;

    /* Found the marker — scan from the { position for matching closing brace */
    var jsonStart = pos + markerStr.indexOf('{');
    var depth = 0, inStr = false, esc = false;
    for (var k = jsonStart; k < raw.length; k++) {
      var c = raw[k];
      if (esc)               { esc = false; continue; }
      if (c === 0x5C && inStr) { esc = true; continue; }  /* \ */
      if (c === 0x22)        { inStr = !inStr; continue; } /* " */
      if (inStr) continue;
      if (c === 0x7B)        depth++;                       /* { */
      else if (c === 0x7D) {                                /* } */
        depth--;
        if (depth === 0) {
          try {
            return JSON.parse(new TextDecoder().decode(raw.slice(jsonStart, k + 1)));
          } catch (e2) { break; }
        }
      }
    }
  }

  throw new Error('No state data found in this PDF. Make sure it was exported from the Preproduction tool.');
}

/* =================================================================
   ROLE / LOCALSTORAGE HELPERS
================================================================= */
var LS_ROLE_KEY     = 'pp_role';
var LS_JOB_PREFIX   = 'pp_job_';
var LS_ACTIVE_JOBS  = 'pp_active_jobs';

function getRole()          { return localStorage.getItem(LS_ROLE_KEY) || null; }
function setRole(role)      { localStorage.setItem(LS_ROLE_KEY, role); }

function saveJobState(jobOrder, state) {
  localStorage.setItem(LS_JOB_PREFIX + jobOrder, JSON.stringify(state));
  /* Track the list of active job IDs */
  var ids = getActiveJobIds();
  if (ids.indexOf(jobOrder) === -1) ids.push(jobOrder);
  localStorage.setItem(LS_ACTIVE_JOBS, JSON.stringify(ids));
}

function loadJobState(jobOrder) {
  var raw = localStorage.getItem(LS_JOB_PREFIX + jobOrder);
  return raw ? JSON.parse(raw) : null;
}

function getActiveJobIds() {
  var raw = localStorage.getItem(LS_ACTIVE_JOBS);
  return raw ? JSON.parse(raw) : [];
}

function removeJobState(jobOrder) {
  localStorage.removeItem(LS_JOB_PREFIX + jobOrder);
  var ids = getActiveJobIds().filter(function(id) { return id !== jobOrder; });
  localStorage.setItem(LS_ACTIVE_JOBS, JSON.stringify(ids));
}

/* =================================================================
   TRIGGER PDF DOWNLOAD
================================================================= */
function downloadPDF(bytes, filename) {
  var blob = new Blob([bytes], { type: 'application/pdf' });
  var url  = URL.createObjectURL(blob);
  var a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
}
