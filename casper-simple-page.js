/*
  - Copyright (c) 2014-2016 Cloudware S.A. All rights reserved.
  -
  - This file is part of casper-simple-page.
  -
  - casper-simple-page is free software: you can redistribute it and/or modify
  - it under the terms of the GNU Affero General Public License as published by
  - the Free Software Foundation, either version 3 of the License, or
  - (at your option) any later version.
  -
  - casper-simple-page  is distributed in the hope that it will be useful,
  - but WITHOUT ANY WARRANTY; without even the implied warranty of
  - MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  - GNU General Public License for more details.
  -
  - You should have received a copy of the GNU Affero General Public License
  - along with casper-simple-page.  If not, see <http://www.gnu.org/licenses/>.
  -
*/

import '@polymer/paper-input/paper-input.js';
import '@toconline/casper-icons/casper-icon.js';
import '@vaadin/vaadin-split-layout/vaadin-split-layout.js';
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import { afterNextRender } from '@polymer/polymer/lib/utils/render-status.js';

class CasperSimplePage extends PolymerElement {
  static get template() {
    return html`
      <style>
        :host {
          display: flex;
          height: 100%;
          margin: 0;
          flex-direction: column;
        }

        #simplePage {
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .paper-input {
          width: 30%;
        }

        .casper-icon {
          margin-right: 10px;
          color: var(--primary-color);
        }

        .header {
          display: flex;
          margin: 0 20px;
          flex-grow: 0;
          flex-direction: row;
          align-items: center;
        }

        .content {
          display: flex;
          position: relative;
          margin: 0px 20px 10px 20px;
          background: var(--secondary-color);
          flex-grow: 2;
          height:100%;
        }

        .center {
          display: none;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          flex-direction: column;
          align-items: center;
          color: #888;
        }

        .visible {
          display: flex
        }

        .empty-data {
          width: 125px;
          height: 125px;
          margin-bottom: 15px;
        }

        .fadeout {
          opacity: 1.0;
          transition: opacity 2.0s ease-in;
        }

        vaadin-split-layout {
          height: 100%;
        }

        slot[name=right] {
          display: flex;
          margin-left: auto;
        }


        #tabulaRasa casper-icon {
          background: var(--no-grid--icon--background-color);
          padding: var(--no-grid--icon--padding);
          border-radius: var(--no-grid--icon--border-radius);
          border: var(--no-grid--icon--border);

          width: var(--no-grid--icon--width, '100px');
          height: var(--no-grid--icon--height, '100px');
          margin-bottom: 25px;
          color: var(--no-grid--icon--color, var(--status-gray));
        }

      </style>

      <div class="header">
        <slot name="left"></slot>
        <paper-input tabindex="0" id="search" class="paper-input" no-label-float label="[[searchHint]]" hidden$="[[noFilter]]">
          <casper-icon class="casper-icon" icon="fa-regular:search" slot="prefix"></casper-icon>
        </paper-input>
        <slot name="middle"></slot>
        <slot name="right"></slot>
      </div>
      <vaadin-split-layout id="splitLayout">
        <div id="primary">
          <div id="simplePage">
            <div id="content" class="content">
              <slot name="list"></slot>
              <div id="spinner" class="center">
                <loading-icon-02 id="loading"></loading-icon-02>
                <span>[[loadingMessage]]</span>
              </div>
              <div id="tabulaRasa" class="center">
                <casper-icon class="empty-data" icon="custom/empty-state"></casper-icon>
                <span>[[tabulaRasa]]</span>
                <slot name="tabula-rasa-action"></slot>
              </div>
            </div>
            <slot name="menu"></slot>
          </div>
        </div>
        <template is="dom-if" if="[[useSplitter]]">
          <div id="secondary">
            <slot name="rightSection"></slot>
          </div>
        </template>
      </vaadin-split-layout>
    `;
  }

  static get is () {
    return 'casper-simple-page';
  }

  static get properties() {
    return {
      searchHint: {
        type: String,
        value: 'Pesquisar'
      },
      tabulaRasa: {
        type: String,
        value: 'Nenhum resultado encontrado'
      },
      loadingMessage: {
        type: String,
        value: 'Aguarde p.f.'
      },
      items: {
        type: Object,
        observer: '_onItemsChanged'
      },
      activeItem: {
        type: Object,
        notify: true
      },
      searchFields: {
        type: Object
      },
      filterFunction: {
        type: Object
      },
      useSplitter: {
        type: Boolean,
        value: false,
        observer: '_splitterChangedState'
      },
      splitterPageWidth: {
        type: Number,
        value: 40,
        observer: '_splitterChangedState'
      },
      noFilter: {
        type: Boolean,
        value: false
      },
      displayedItems: {
        type: Array,
        notify: true
      }
    };

  }

  static get clickEvent () {
    return 'tap';
  }

  _splitterChangedState () {
    this.$.splitLayout.shadowRoot.querySelector('#splitter').style.display = this.useSplitter ? "block" : "none";
    this.$.primary.style.width = this.useSplitter ? ((100 - this.splitterPageWidth) + "%") : "100%";
    setTimeout(function() {
      if ( this.shadowRoot.querySelector('#secondary') ) {
          this.shadowRoot.querySelector('#secondary').style.width = this.useSplitter ? (this.splitterPageWidth + "%") : "0%";
      }
    }.bind(this), 0);
  }

  connectedCallback () {

    super.connectedCallback();
    this.$.loading.margin = '12px';
    this._isVaadinGrid = false;

    for (let child of this.children ) {
      if ( child.hasAttribute('slot') ) {
        if ( child.getAttribute('slot') === 'list' ) {
          this._list = child;
          this._list.style.display = 'none';
          this._list.addEventListener('click', (e) => this._onClick(e));
          this._list.addEventListener('mousemove', (e) => this.app.tooltip.mouseMoveToolip(e));
          if ( this._list.tagName === 'VAADIN-GRID' ) {
            this._isVaadinGrid = true;
            this._list.style.backgroundColor = 'var(--secondary-color)';
          }
          this._list.items = this.items;
          this._list.style.height = 'auto';
        } else if ( child.getAttribute('slot') === 'menu' ) {
          this._menu = child;
          this._menu.fitInto = this;
          this._menu.addEventListener('click', (e) => this._contextMenuClick(e));
        }
      }
    }

    this._list.addEventListener('active-item-changed', function(event) {
      if (event.detail.value) {
        this.activeItem = event.detail.value;
      }
    }.bind(this));

    this.$.search.addEventListener('value-changed', (e) => this._debouncedFilterItems(e));
    this._updateState();
    afterNextRender(this.$.search, () => {
      this.$.search.focus();
    });
  }

  disconnectedCallback () {
    super.disconnectedCallback();
    clearTimeout(this._filterDebounceTimer);
    this._filterDebounceTimer = undefined;
  }

  _onItemsChanged (value) {
    if ( this._list ) {
      this._list.items = value;
      this.filterItems();
    }
    this._updateState();
  }

  _debouncedFilterItems (event) {
    if ( this._filterDebounceTimer === undefined ) {
      this.filterItems(event.detail.value);
    } else {
      clearTimeout(this._filterDebounceTimer);
    }
    this._filterDebounceTimer = setTimeout((e) => this.filterItems(), 200);
  }

  filterItems (query) {
    if (this.noFilter || this.items === undefined || !this.items || this.items.length === 0) {
        return;
    }

    let filter = this.filterFunction;
    query = query || this.$.search.value || '';
    if ( query === this._lastQuery && !filter ) {
        return;
    }

    let itemMatched, totalMatches;
    this._lastQuery = query;

    if ( (query === '' && !filter) || !this.items ) {
      this._list.items = null;
      this._list.items = this.items;
    } else {
      let filteredItems = [];
      let queryNormalized = (query.normalize('NFD').replace(/[\u0300-\u036f]/g, '')).toLowerCase().split(' ').filter(function(el) { return el !== '' });

      for (let item of this.items) {
        // If no searchFields are specified, iterate the item keys to include all 'stringable' fields
        if (!this.searchFields) {
          let searchFields = [];
          Object.keys(item).forEach((index) => {
            try {
              if (item[index].toString()) {
                searchFields.push(index);
              }
            } catch (e) {}
          });
          this.searchFields = searchFields;
        }
        itemLoop: {
          itemMatched = false;
          totalMatches = 0;
          if (query !== '') {
            for (let term of queryNormalized) {
              termLoop: {
                for (let field of this.searchFields) {
                  try {
                    let normalizedField = item[field].toString().normalize('NFD').replace(/[\u0300-\u036f]/g, "").toLowerCase();
                    let filterResult = 1;

                    if (filter) {
                      filterResult = filter(queryNormalized.join(" "), normalizedField, field);
                      switch (filterResult) {
                        case 0:
                          itemMatched = false;
                          break itemLoop;
                        case 2:
                          itemMatched = true;
                          break itemLoop;
                      }
                    }

                    if (normalizedField.indexOf(term) !== -1 && filterResult === 1) {
                      totalMatches++;
                      if (totalMatches >= queryNormalized.length) {
                        itemMatched = true;
                        if (!filter) {
                            break itemLoop;
                        } else {
                            continue;
                        }
                      } else {
                        break termLoop;
                      }
                    }
                  } catch (e) {}
                }
              }
            }
          } else {
            for (let field of this.searchFields) {

              let filterResult = 1;
              let normalizedField = item[field].toString().normalize('NFD').replace(/[\u0300-\u036f]/g, "").toLowerCase();

              filterResult = filter('', normalizedField, field);
              switch (filterResult) {
                case 0:
                  itemMatched = false;
                  break itemLoop;
                case 1:
                  itemMatched = true;
                  break;
                case 2:
                  itemMatched = true;
                  break itemLoop;
              }
            }
          }
        }

        if ( itemMatched ) {
            filteredItems.push(item);
        }
      }
      this._list.items = null;
      this._list.items = this.displayedItems = filteredItems;
    }

    if (this._list.items === null || this._list.items === undefined) {
        this.state = 'loading';
    } else if (this._list.items.length === 0) {
        this.state = 'empty';
    } else {
        this.state = 'loaded';
    }

    this._filterDebounceTimer = undefined;
  }

  _onClick (event) {
    let target, action;
    let target_path

    // ... find event path for any browser ...
    if ( event.path !== undefined ) {
      target_path = event.path;
    } else {
      target_path = event.b;
    }
    if ( target_path === undefined ) {
      target_path = event.composedPath();
    }

    // ... go up to find an element with an action attribute ...
    for ( target of target_path ) {
      if ( target.idx !== undefined && target.hasAttribute('action')) {
        action = target.getAttribute('action');
        if ( action === 'menu' ) {
          if (this._menu.positionTarget && this._menu.positionTarget === target && this._menu && this._menu.opened ) {
            this._menu.close();
            return;
          }
          this._menu.positionTarget = target;
          this._list.style.height = 'auto';
          this._menu.refit();
          clearTimeout(this._menuHideTimer);
          this._menuHideTimer = undefined;
          this._menu.classList.remove('fadeout');
          this._menu.style.opacity = 1.0;
          event.preventDefault();
          event.stopPropagation();
          this.app.socket.userActivity(event);
          this.app.tooltip.hide();
          if ( ! this._menu.opened ) {
            this._menu.open();
          }
          return;
        } else {
          break;
        }
      }
    }

    if ( this.activeItem !== undefined && action !== undefined ) {
      event.preventDefault();
      event.stopPropagation();
      this.app.socket.userActivity(event);
      this.app.tooltip.hide();
      this.dispatchEvent(new CustomEvent(CasperSimplePage.clickEvent, { bubbles: true, composed: true, detail: { item: this.activeItem, target: target }}));
    }

  }

  _contextMenuClick (event) {
    let target_path;

    // ... find event path for any browser ...
    if ( event.path !== undefined ) {
      target_path = event.path;
    } else {
      target_path = event.b;
    }
    if ( target_path === undefined ) {
      target_path = event.composedPath(); // Use event.composedPath if event.path and event.b doesn't exist
    }

    for ( let target of target_path ) {
      if ( target instanceof HTMLElement && target.hasAttribute('action') ) {
        event.preventDefault();
        event.stopPropagation();
        this.app.socket.userActivity(event);
        this.dispatchEvent(new CustomEvent(CasperSimplePage.clickEvent, { bubbles: true, composed: true, detail: { item: this.activeItem, target: target }}));
        this._menu.close();
        break;
      }
    }
  }

  _updateState () {
    if ( !this._list || !this._list.items ) {
      this.state = 'loading';
    } else if ( this._list.items.length === 0 ) {
      this.state = 'empty';
    } else {
      this.state = 'loaded';
    }
  }

  set state (state) {
    if ( this._state !== state ) {
      switch (state) {
        case 'loading':
          this.$.tabulaRasa.classList.remove('visible');
          this.$.spinner.classList.add('visible');
          if ( this._list ) {
            this._list.classList.remove('visible');
            this._list.style.display = 'none';
          }
          this.$.search.disabled = true;
        break;
        case 'empty':
          this.$.tabulaRasa.classList.add('visible');
          this.$.spinner.classList.remove('visible');
          this._list.style.display = 'none';
          this.$.search.disabled = false;
        break;
        case 'loaded':
        default:
          this.$.tabulaRasa.classList.remove('visible');
          this.$.spinner.classList.remove('visible');
          this._list.style.display = 'block';
          this.$.search.disabled = false;
        break;
      }
    }
  }
}


window.customElements.define(CasperSimplePage.is, CasperSimplePage);
