/*
 * Copyright (C) 2007-2019 Crafter Software Corporation. All Rights Reserved.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

define('dnd-controller', ['crafter', 'jquery', 'jquery-ui', 'animator', 'communicator'], function (crafter, $, $ui, Animator, Communicator) {
  'use strict';

  var Topics = crafter.studio.preview.Topics,
    string = crafter.String;

  var OVERLAY_TPL = '<sdiv class="studio-dnd-controller-overlay"></sdiv>';
  var PALETTE_TPL = [
    '<sdiv class="studio-components-panel">',
    '<sbutton class="btn btn-primary" data-action="done" data-translation="done">Done</sbutton>',
    '<sh1 class="studio-panel-title" data-translation="components">Components</sh1>',
    '<sdiv class="studio-component-search"><input type="search" placeholder="search components..." /></sdiv>',
    '<sdiv class="studio-components-container"></sdiv>',
    '</sdiv>'].join('');
  var COMPONENT_TPL = '<sli><sa class="studio-component-drag-target" data-studio-component data-studio-component-path="%@" data-studio-component-type="%@"><span class="status-icon fa fa-puzzle-piece"></span>%@</sa></sli>';
  //var BROWSE_TPL = '<button class="btn btn-primary add-component" data-path="%@">Browse %@</button>';
  var BROWSE_TPL = '<sdiv class="studio-category"><sh2 class="studio-category-name add-existing-component pointer" id="%@" data-path="%@">Browse %@</sh2><sul></sul></sdiv>';
  var DRAGGABLE_SELECTION = '.studio-components-container .studio-component-drag-target';
  var DROPPABLE_SELECTION = '[data-studio-components-target]';
  var PANEL_ON_BD_CLASS = 'studio-dnd-enabled';
  var DROPPABLE_SELECTION_SIZE = '[data-studio-components-size]';

  var $body = $('body:first');
  var $document = $(document);
  var $window = $(window);
  var found = {};
  var pathSearched = [];
  var currentModel = {};

  function DnDController(config) {

    var $overlay = $(OVERLAY_TPL),
      $palette = $(PALETTE_TPL),
      animator = new Animator(),
      config = config || {},
      communicator = config.communicator,
      active = false,
      me = this,
      timeout;

    $palette.on('click', '[data-action]', function (e) {
      e.stopPropagation();
      me[$(this).data('action')]();
    });

    this.active = function (value) {
      if (arguments.length) {
        (active = !!value);
      }
      return active;
    };

    this.cfg = function (property, value) {
      if (arguments.length > 1) config[property] = value;
      return config[property];
    };

    this.getAnimator = function ($el) {
      $el && animator.$el($el);
      return animator;
    };

    this.getOverlay = function () {
      return $overlay;
    };

    this.getPalette = function () {
      return $palette;
    };

    $palette.on('click', '.studio-category-name-collapse', function () {
      $(this).parent().toggleClass('studio-collapse');
    });

    // TODO currently not in use.
    // component-panel.js loads from page load rather than when enabling dnd
    // hence the page model loads from page load too.
    if (communicator) {
      communicator.on(Topics.DND_COMPONENT_MODEL_LOAD, function (data) {
        componentModelLoad.call(me, data.trackingNumber, data.model);
      });
      communicator.on(Topics.DND_COMPONENTS_MODEL_LOAD, function (data) {
        componentsModelLoad.call(me, data);
      });
    }

  }

  DnDController.prototype = {
    start: enableDnD,
    stop: disableDnD,
    done: done
  };

  return DnDController;

  function findZIndex() {
    var highest = -999;
    $("*").each(function () {
      var current = parseInt($(this).css("z-index"), 10);
      if (current && highest < current) highest = current;
    });
    return highest;
  }

  function disableDnD() {
    var
      callback,
      key = 'pto-on',
      communicator = this.cfg('communicator');

    callback = function (message) {
      if (message.key === key) {
        communicator.unsubscribe(Topics.REQUEST_SESSION_STORAGE_ITEM_REPLY, callback);

        if (!!message.value) {
          communicator.publish(Topics.SET_SESSION_STORAGE_ITEM, {
            key: 'components-on',
            value: ''
          });
        }

        if (!this.active()) {
          return;
        }

        this.active(false);

        $(DRAGGABLE_SELECTION).draggable('destroy');
        $(DROPPABLE_SELECTION).sortable('destroy');
        $body.removeClass(PANEL_ON_BD_CLASS);

        var $p = this.getPalette(),
          $o = this.getOverlay();

        this.getAnimator($o).fadeOut();
        this.getAnimator($p).slideOutRight(function () {
          $o.detach();
          $p.detach();
            expandContractChannel();
        });

        $('.removeComp').remove();

      }
    };

    communicator.on(Topics.REQUEST_SESSION_STORAGE_ITEM_REPLY, callback.bind(this));
    publish.call(this, Topics.REQUEST_SESSION_STORAGE_ITEM, key);

  }

  function done() {

    var me = this, callback, communicator = this.cfg('communicator');
    callback = function (message) {
      if ((typeof message === 'object') && ('ice-on' in message)) {
        communicator.unsubscribe(Topics.REQUEST_SESSION_STORAGE_ITEM_REPLY, callback);

        amplify.publish(Topics.ICE_TOOLS_OFF);
        me.stop();

        var
          iceOn = !!(message['ice-on']),
          ptoOn = !!(message['pto-on']);

        if (ptoOn) {
          publish.call(me, Topics.STOP_DRAG_AND_DROP);
        }
        if (iceOn) {
          publish.call(me, Topics.ICE_CHANGE_PENCIL_ON);
        }

      }
    };

    communicator.on(Topics.REQUEST_SESSION_STORAGE_ITEM_REPLY, callback);
    publish.call(this, Topics.REQUEST_SESSION_STORAGE_ITEM, ['ice-on', 'pto-on']);

  }

  function enableDnD(components, initialComponentModel, browse) {
    amplify.publish(Topics.ICE_TOOLS_OFF);

    publish.call(this, Topics.SET_SESSION_STORAGE_ITEM, {
      key: 'components-on',
      value: 'true'
    });

    publish.call(this, Topics.ICE_CHANGE_PENCIL_OFF);
    currentModel = initialComponentModel;

    if (this.active()) return;
    this.active(true);

    var $p = this.getPalette(),
      $o = this.getOverlay(),
      me = this;

    $body.addClass(PANEL_ON_BD_CLASS);

    $o.appendTo($body);
    $p.appendTo($body);

    renderPalette.call(this, components, browse);

    this.getAnimator($o).fadeIn();
    this.getAnimator($p).slideInRight(function () {
        expandContractChannel('expand');
    });

    $("[data-studio-components-size='small']").each(function (index) {
      $(this).width($(this).width() / 2);
    });

    $(DRAGGABLE_SELECTION).draggable({
      revert: 'invalid',
      helper: 'clone',
      appendTo: 'body',
      cursor: 'move',
      connectToSortable: DROPPABLE_SELECTION,
      zIndex: 1030
    });

    function updateDop(self, me, ui) {
      var $dropZone = $(self),
        $component = ui.item,
        compPath = $component.attr('data-studio-component-path'),
        zonePath = $dropZone.parents('[data-studio-component-path="' + compPath + '"]').attr('data-studio-component-path'),
        orgZoneComp = ui.item.parents('[data-studio-components-target]').parents('[data-studio-component-path]'),
        destZoneComp = $dropZone.parents('[data-studio-component-path]');
      if (compPath != zonePath && ((orgZoneComp.attr('data-studio-component-path') != destZoneComp.attr('data-studio-component-path') ||
        (orgZoneComp.attr('data-studio-component-path') == destZoneComp.attr('data-studio-component-path') &&
          $dropZone.attr('data-studio-components-objectid') != ui.item.parents('[data-studio-components-target]').attr('data-studio-components-objectid')) ||
        (orgZoneComp.attr('data-studio-component-path') == destZoneComp.attr('data-studio-component-path') &&
          orgZoneComp.attr('data-studio-tracking-number') == destZoneComp.attr('data-studio-tracking-number') &&
          $dropZone.attr('data-studio-components-objectid') == ui.item.parents('[data-studio-components-target]').attr('data-studio-components-objectid'))))) {
        componentDropped.call(me, $dropZone, $component);
      } else {
        $(DROPPABLE_SELECTION).sortable("cancel");
      }
    }

    $(DROPPABLE_SELECTION).sortable({
      me: this,
      items: '[data-studio-component]',
      cursor: 'move',
      forceHelperSize: true,
      forcePlaceholderSize: true,
      greedy: true,
      connectWith: DROPPABLE_SELECTION,
      hoverClass: 'studio-draggable-over',
      over: function (event, ui) {
        $(this).addClass('studio-draggable-over');
      },
      out: function (event, ui) {
        $(this).removeClass('studio-draggable-over');
      },
      start: function (event, ui) {
        ui.item.addClass('studio-component-over');
      },
      stop: function (event, ui) {
        ui.item.removeClass('studio-component-over');
      },
      update: function (e, ui) {
        var self = this;
        if (!ui.sender) {
          updateDop(self, me, ui);
        } else {
          setTimeout(function () {
            updateDop(self, me, ui);
          }, 300);
        }

      }
    });

    $('[data-studio-component]').each(function () {
      $(this).attr('data-studio-tracking-number', crafter.guid());
    });

    $('[data-studio-components-target]').each(function (i) {
      var $me = $(this);
      $me.attr('data-studio-zone-tracking', crafter.guid());
      //$me.attr('data-studio-components-target', i + '_' + $me.attr('data-studio-components-target'));
    });

    componentsModelLoad.call(me, initialComponentModel);

    $(".ui-sortable-handle").each(function (index) {
      var delControl = createDeleteControl('removeComp fa fa-times-circle');
      delControl.onclick = function () {
        var compPath = $(this).parent().parents('[data-studio-component-path]').attr('data-studio-component-path');
        var objectId = $(this).parent().parents('[data-studio-components-target]').attr('data-studio-components-objectid');
        var compTracking = $(this).parent().parents('[data-studio-component-path]').attr('data-studio-tracking-number');
        var dropName = $($(this).parent().parents('[data-studio-components-target]')[0]).attr('data-studio-components-target');
        var trackingZone = $($(this).parent().parents('[data-studio-components-target]')[0]).attr('data-studio-zone-tracking');
        var index = 0, currentTag = "", zone;
        removeComponent(this, function () {
          var zones = {};
          var conRepeat = 0;
          var indexStructure = 0;
          setTimeout(function () {

            $('[data-studio-components-target]').each(function () {
              zone = $(this).attr("data-studio-components-target");
              if (currentTag !== zone) {
                index = 0;
                currentTag = zone;
              }
              if (objectId == $(this).attr('data-studio-components-objectid') && trackingZone == $(this).attr('data-studio-zone-tracking')) {
                if (dropName == $(this).attr('data-studio-components-target')) {
                  conRepeat++;
                }
                if (compTracking == $(this).parents('[data-studio-component-path]').attr('data-studio-tracking-number')) {
                  var $el = $(this),
                    zoneName = $el.attr('data-studio-components-target');
                  zones[zoneName] = [];
                  $el.find('> [data-studio-component]').each(function (i, el) {
                    var $comp = $(this);
                    zones[zoneName].push($comp.data('model') || tracking);
                  });
                }
                if (zone.indexOf('.') > 0) {
                  if (currentTag !== zone) {
                    index = 0;
                    currentTag = zone;
                  }
                  var structure1 = zone.split('.')[0],
                    structure2 = zone.split('.')[1];
                  currentModel[structure1][index][structure2] = zones[zone];
                  zones[structure1] = currentModel[structure1];
                }
              }
              index++;
            });

            publish.call(me, Topics.SAVE_DRAG_AND_DROP, {
              isNew: false,
              zones: zones,
              compPath: compPath,
              conComp: (conRepeat > 1) ? true : false
            });

          });
        });
      };
      $(this).append(delControl);
    });

  }

  function expandContractChannel(opt) {
    var
      $studioChannelPortrait = $('.studio-device-preview-portrait', parent.document)[0],
      $studioChannelLandscape = $('.studio-device-preview-landscape', parent.document)[0];
    if ($studioChannelPortrait || $studioChannelLandscape) {
      var
        inputChannelWidth = $('[data-axis="x"]', parent.document),
        width = inputChannelWidth.val() || 'auto',
        $engine = $('#engineWindow', parent.document);

      width = opt === 'expand' ? parseInt(width) + 265 : parseInt(width);
      $engine.width(
        (width === 'auto' || width === '')
          ? '' : parseInt(width));
    }
  }

  function componentDropped($dropZone, $component) {

    var compPath = $dropZone.parents('[data-studio-component-path]').attr('data-studio-component-path');
    var compTracking = $dropZone.parents('[data-studio-component-path]').attr('data-studio-tracking-number');
    var objectId = $dropZone.attr('data-studio-components-objectid');
    var trackingZone = $dropZone.attr('data-studio-zone-tracking');
    var dropName = $dropZone.attr('data-studio-components-target');
    var index = 0, currentTag = "", zone;

    var me = this,
      isNew = $component.hasClass('studio-component-drag-target'),
      tracking, path, type, name, zones = {}, indexStructure = 0;

    if (isNew) {
      path = $component.attr('data-studio-component-path');
      type = $component.attr('data-studio-component-type');
      name = $component.text();
      tracking = crafter.guid();
      $component.before(
        string('<div data-studio-component="%@" data-studio-component-path="%@" data-studio-tracking-number="%@">%@</div>')
          .fmt(type, path, tracking, name));
      $component.remove();
    } else {
      tracking = $component.attr('data-studio-tracking-number');
      path = $component.attr('data-studio-component-path');
      type = $component.attr('data-studio-component');
    }

    // DOM Reorganization hasn't happened at this point,
    // need a timeout to grab out the updated DOM structure
    var conRepeat = 0;
    setTimeout(function () {

      $('[data-studio-components-target]').each(function () {
        zone = $(this).attr("data-studio-components-target");
        if (currentTag !== zone) {
          index = 0;
          currentTag = zone;
        }
        if (objectId == $(this).attr('data-studio-components-objectid') && trackingZone == $(this).attr('data-studio-zone-tracking')) {
          if (dropName == $(this).attr('data-studio-components-target')) {
            conRepeat++;
          }
          if (compTracking == $(this).parents('[data-studio-component-path]').attr('data-studio-tracking-number')) {
            var $el = $(this),
              zoneName = $el.attr('data-studio-components-target');
            zones[zoneName] = [];
            $el.find('> [data-studio-component]').each(function (i, el) {
              var $comp = $(this);
              zones[zoneName].push($comp.data('model') || tracking);
            });
          }
          if (zone.indexOf('.') > 0) {
            var structure1 = zone.split('.')[0],
              structure2 = zone.split('.')[1];
            currentModel[structure1][index][structure2] = zones[zone];
            zones[structure1] = currentModel[structure1];
          }
        }
        index++;
      });

      publish.call(me, Topics.COMPONENT_DROPPED, {
        path: path,
        type: type,
        isNew: isNew,
        zones: zones,
        trackingNumber: tracking,
        compPath: compPath,
        conComp: (conRepeat > 1) ? true : false
      });

    });
  }

  function componentModelLoad(tracking, data) {
    $('[data-studio-tracking-number="' + tracking + '"]').data('model', data);
  }

  function componentsModelLoad(data) {
    //console.log("test");
    var aNotFound = [],
      me = this,
      noObjectid = 0,
      structure1, structure2, index = 0, currentTag = "";

    $('[data-studio-components-target]').each(function () {
      var $el = $(this),
        objectId = $el.attr('data-studio-components-objectid'),
        tracking = $el.attr('data-studio-zone-tracking'),
        name = $el.attr('data-studio-components-target'),
        path = $el.parents('[data-studio-component-path]').attr('data-studio-component-path'),
        id = objectId + "-" + name;
      if (name.indexOf('.') < 0) {
        if (objectId) {
          if (!found[id] || objectId == data['objectId']) {
            if ((data[name] || data[name] == "") && objectId == data['objectId']) { ///objid?
              found[id] = true;
              $el.find('> [data-studio-component]').each(function (i, el) {
                $(this).data('model', data[name][i]);
              });
            } else {
              var repeated = false;
              for (var j = 0; j < aNotFound.length; j++) {
                if (aNotFound[j].path == path && aNotFound[j].name == name) {
                  repeated = true;
                }
              }
              if (!repeated) {
                aNotFound.push({ path: path, name: name });
              }
            }
          }
        } else {
          noObjectid++
        }
      } else {
        if (currentTag !== name) {
          index = 0;
          currentTag = name;
        }
        structure1 = name.split('.')[0];
        structure2 = name.split('.')[1];
        if (objectId) {
          if (!found[id] || objectId == data['objectId']) {
            if ((data[structure1][index][structure2] || data[structure1][index][structure2] == "") && objectId == data['objectId']) { ///objid?
              found[id] = true;
              $el.find('> [data-studio-component]').each(function (i, el) {
                $(this).data('model', data[structure1][index][structure2][i]);
              });
            } else {
              var repeated = false;
              for (var j = 0; j < aNotFound.length; j++) {
                if (aNotFound[j].path == path && aNotFound[j].name == name) {
                  repeated = true;
                }
              }
              if (!repeated) {
                aNotFound.push({ path: path, name: name });
              }
            }
            index++;
          }
        } else {
          noObjectid++
        }
      }

    });

    var isSearched = false;
    if (aNotFound.length && aNotFound.length > 0) {
      if (aNotFound[0].path) {
        for (var i = 0; i < pathSearched.length; i++) {
          if (aNotFound[0].path === pathSearched[i]) {
            isSearched = true;
          }
        }
        if (!isSearched) {
          pathSearched.push(aNotFound[0].path);
          publish.call(this, Topics.LOAD_MODEL_REQUEST, {
            aNotFound: aNotFound[0]
          });
        }
      } else {
        publish.call(me, Topics.START_DIALOG, {
          message: 'Model is incomplete. Drag and Drop is not going to work properly.'
        });
      }
    }
    if (noObjectid > 0) {
      publish.call(me, Topics.START_DIALOG, {
        message: 'Object Id is missing. Drag and Drop is not going to work properly.'
      });
    }
  }

  function publish(topic, message, com) {
    if (com = this.cfg('communicator')) {
      com.publish(topic, message);
    }
  }

  function resize() {
    this.getOverlay().css({
      width: $document.width(),
      height: $document.height()
    });
  }

  function renderPalette(components, browse) {
    var html = [],
      $c = this.getPalette().children('.studio-components-container'),
      me = this,
      browseId = "";
    $.each(components || [], function (i, category) {
      html.push('<sdiv class="studio-category">');
      html.push('<sh2 class="studio-category-name studio-category-name-collapse">' + category.label + '</sh2>');
      html.push('<sul>');
      if (category.components) {
        if (category.components.length) {
          $.each(category.components, function (j, component) {
            html.push(crafter.String(COMPONENT_TPL)
              .fmt(component.path, component.type, component.label));
          });
        } else {
          html.push(crafter.String(COMPONENT_TPL)
            .fmt(category.components.path, category.components.type, category.components.label));
        }
      }
      html.push('</sul>');
      html.push('</sdiv>');
    });
    $.each(browse || [], function (i, browse) {
      browseId = browse.label.replace(/\s|-|_|\/\./g, "").toLowerCase();
      html.push(crafter.String(BROWSE_TPL)
        .fmt(browseId, browse.path, browse.label));
    });
    //html.push('<button class="btn btn-primary add-component" data-translation="addComponent">Add Component</button>');
    $c.html(html.join(''));

    $('.add-existing-component').on('click', function (e) {
      e.preventDefault();
      var path = $(this).attr('data-path');

      publish.call(me, Topics.OPEN_BROWSE, {
        path: path
      });
    });
  }

  function createDeleteControl(className) {
    var deleteEl = document.createElement("a"),
      btnEl = document.createElement("i");

    $(deleteEl).addClass(className);

    btnEl.style.width = "16px";
    btnEl.style.height = "16px";

    deleteEl.appendChild(btnEl);
    return deleteEl;
  }

  function removeComponent(srcEl, callback) {

    srcEl.parentNode.remove();

    //Utility.refreshPlaceholderHeight(srcContainer);

    if (typeof callback == "function") {
      callback();
    }
  }

});