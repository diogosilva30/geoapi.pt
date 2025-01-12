/* handlebars helper functions */

const debug = require('debug')('geoapipt:helpers')

module.exports = { obj2html, obj2dataAttribute, getHostnameFromUrl }

function obj2html (data, typeOfLink) {
  let html = ''

  const tableStart = '<table class="table table-hover"><tbody>'
  const tableEnd = '</tbody></table>'

  const renderTextAsRow = function (text, colPos) {
    html += '<tr>'
    if (!colPos) {
      html += `<th scope="row" colspan="2">${getLink(text, typeOfLink)}</th>`
    } else if (colPos === 1) {
      html +=
        `<th class="w-50" scope="row">${text}</th>` +
        '<td class="w-50"></td>'
    } else if (colPos === 2) {
      html +=
        '<td class="w-50"></td>' +
        `<td class="w-50">${getLink(text, typeOfLink)}</td>`
    }
    html += '</tr>'
  }

  // details makes reference to <details>, see issue #57
  const renderObjAsRow = function (obj, details) {
    if (details) {
      html += `<tr><td colspan="2"><details><summary>${details}</summary>` +
        '<table class="w-100"><tbody>'
    }

    for (const key in obj) {
      if (typeof obj[key] === 'string' || typeof obj[key] === 'number') {
        html +=
          '<tr>' +
          `  <td class="w-50">${key}</td>` +
          `  <td class="w-50">${obj[key]}</td>` +
          '</tr>'
      } else if (isObj(obj[key])) {
        renderObjAsRow(obj[key], key)
      } else if (Array.isArray(obj[key])) {
        renderTextAsRow(key, 1)
        obj[key].forEach(el => {
          if (isObj(el)) {
            renderObjAsRow(el)
          } else {
            renderTextAsRow(el, 2)
          }
        })
      }
    }

    if (details) {
      html += '</tbody></table></details></td></tr>'
    }
  }

  if (Array.isArray(data)) {
    // if all elements of array are text elements, renders one single table for all elements
    if (data.every(el => typeof el === 'string')) {
      html += tableStart
      for (let i = 0; i < data.length; i++) {
        renderTextAsRow(data[i])
      }
      html += tableEnd

    // array of objects
    } else {
      for (let i = 0; i < data.length; i++) {
        html += tableStart
        renderObjAsRow(data[i])
        html += tableEnd
        if (i !== data.length - 1) {
          html += '<div class="m-5">&nbsp;</div>'
        }
      }
    }

  // data is a single object
  } else if (isObj(data)) {
    html += tableStart
    renderObjAsRow(data)
    html += tableEnd
  } else if (typeof data === 'string') {
    html += tableStart
    renderTextAsRow(data)
    html += tableEnd
  }

  debug('obj2html: ', html)
  return html
}

// get a link for parish or municipality, when presenting results as html
function getLink (name, typeOfLink) {
  const encodeName = (str) => {
    return encodeURIComponent(str.toLowerCase())
  }

  if (typeOfLink === 'municipality') {
    return `<a href="/municipios/${encodeName(name)}">${name}</a>`
  } else if (typeOfLink === 'parish') {
    return `<a href="/freguesias/${encodeName(name)}">${name}</a>`
  } else if (/municipality\/.+\/parish$/.test(typeOfLink)) {
    // ex: typeOfLink === 'municipality/lisboa/parish'
    const municipalityMatch = typeOfLink.match(/municipality\/(.+)\/parish$/)
    if (municipalityMatch && municipalityMatch[1]) {
      return `<a href="/municipios/${encodeName(municipalityMatch[1])}/freguesias/${encodeName(name)}">${name}</a>`
    } else {
      return `<a href="/freguesias/${encodeName(name)}">${name}</a>`
    }
  } else if (typeOfLink === 'parish (municipality)') {
    // ex: name === 'Abade de Neiva (Barcelos)'
    const parish = name.replace(/\(.*\)/, '').trim()
    const municipalityMatch = name.match(/.+\((.+)\)/)
    if (municipalityMatch && municipalityMatch[1]) {
      return `<a href="/municipios/${encodeName(municipalityMatch[1])}/freguesias/${encodeName(parish)}">${name}</a>`
    } else {
      return `<a href="/freguesias/${encodeName(parish)}">${name}</a>`
    }
  } else {
    return name
  }
}

function obj2dataAttribute (obj) {
  const str = encodeURIComponent(JSON.stringify(obj || {}))
  debug('obj2dataAttribute:', str)
  return str
}

function isObj (data) {
  return typeof data === 'object' && !Array.isArray(data) && data !== null
}

function getHostnameFromUrl (url) {
  return (new URL(url)).hostname
}
