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

CStudioAdminConsole.Tool.LogView = CStudioAdminConsole.Tool.LogView || function (config, el) {
	this.containerEl = el;
	this.config = config;
	this.types = [];
	return this;
}

/**
* Overarching class that drives the content type tools
*/
YAHOO.extend(CStudioAdminConsole.Tool.LogView, CStudioAdminConsole.Tool, {
	renderWorkarea: function () {
		var workareaEl = document.getElementById("cstudio-admin-console-workarea"),
			auditUrl = '/studio/#/log?iframe=true&site=' + CStudioAuthoringContext.siteId,
			actions = [];

		workareaEl.innerHTML =
			'<div class="iframe-container" style="position: relative; top: 50px; height: calc(100vh - 50px);">' +
			'<iframe src="' + auditUrl + '" style="width: 100%; height: 100%;"></iframe>' +
			'</div>';

		CStudioAuthoring.ContextualNav.AdminConsoleNav.initActions(actions);
	}
});



CStudioAuthoring.Module.moduleLoaded("cstudio-console-tools-log-view", CStudioAdminConsole.Tool.LogView);