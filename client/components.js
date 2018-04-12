'use strict'

const $ = require('jquery');

// Add select option.
const addOption = (parent, value, text, selected = false) => {
    const selectTag = selected ? ' selected' : '';
    $(parent).append(`<option value="${value}"${selectTag}>${text}</option>`);
}

// Add a new table row.
const addRow = (parent, ...cells) => {
    const tds = cells.map(cell => `<td>${cell}</td>`).join('');
    $(parent).append(`<tr>${tds}</tr>`);
}

// Add div with accept/reject buttons.
const addAction = (parent, label, action) => {
    $(parent).append(`<div><span>${label}</span><input class="accept" type="button" 
    value="Accept"><input class="reject" type="button" value="Reject"></div>`);
}

// Clear select list.
const clearOptions = (parent) => {
    $(parent).children().slice(1).remove();
}

// Clear input.
const clearInput = (parent) => {
    $(parent).empty();
}

// Clear text.
const clearText = (parent) => {
    $(parent).val('');
}

module.exports = {
    addOption,
    addRow,
    addAction,
    clearOptions,
    clearInput,
    clearText
}