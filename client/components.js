'use strict'

// Imports.
const $ = require('jquery');

// Function: Add a new select entry to a dropdown control.
const addOption = (parent, value, text, selected = false) => {
    // Set selected (optional).
    const selectTag = selected ? ' selected' : '';
    $(parent).append(`<option value="${value}"${selectTag}>${text}</option>`);
}

// Function: Add a new row to a table control.
const addRow = (parent, ...cells) => {
    // Dynamic amount of cells allowed.
    const tds = cells.map(cell => `<td>${cell}</td>`).join('');
    $(parent).append(`<tr>${tds}</tr>`);
}

// Function: Add a new div with accept and reject buttons to a parent div.
const addAction = (parent, label, action) => {
    $(parent).append(`<div><span>${label}</span><input class="accept" type="button" 
    value="Accept"><input class="reject" type="button" value="Reject"></div>`);
}

// Function: Clear options of a dropdown control.
const clearOptions = (parent) => {
    $(parent).children().slice(1).remove();
}

// Function: Clear content of a div.
const clearInput = (parent) => {
    $(parent).empty();
}

// Function: Clear text from textbox control.
const clearText = (parent) => {
    $(parent).val('');
}

// Exports: Helper functions.
module.exports = {
    addOption,
    addRow,
    addAction,
    clearOptions,
    clearInput,
    clearText
}