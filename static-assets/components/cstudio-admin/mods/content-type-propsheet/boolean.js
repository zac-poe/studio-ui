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

CStudioAdminConsole.Tool.ContentTypes.PropertyType.Bool = CStudioAdminConsole.Tool.ContentTypes.PropertyType.Bool||  function(fieldName, containerEl)  {
	this.fieldName = fieldName;
	this.containerEl = containerEl;
	return this;
}

YAHOO.extend(CStudioAdminConsole.Tool.ContentTypes.PropertyType.Bool, CStudioAdminConsole.Tool.ContentTypes.PropertyType, {
	render: function(value, updateFn) {
		var _self = this;
		var containerEl = this.containerEl,
            wrapperEl = document.createElement("div"),
            valueEl = document.createElement("input");

		valueEl.type = "checkbox";
		valueEl.checked = (value == "true");
		valueEl.fieldName = this.fieldName;

		wrapperEl.appendChild(valueEl);
		containerEl.appendChild(wrapperEl);

		if(updateFn) {
			var updateFieldFn = function(event, el) {
				_self.value = _self.getValue();
				updateFn(event, _self);
				CStudioAdminConsole.Tool.ContentTypes.visualization.render();
			};
						
			YAHOO.util.Event.on(valueEl, 'change', updateFieldFn, valueEl);
		}
		
		this.valueEl = valueEl;
	},
	
	getValue: function() {
		return ""+(this.valueEl.checked == true);	
	}
});

CStudioAuthoring.Module.moduleLoaded("cstudio-console-tools-content-types-proptype-boolean", CStudioAdminConsole.Tool.ContentTypes.PropertyType.Bool);