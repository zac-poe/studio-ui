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

var YDom = YAHOO.util.Dom;
var YEvent = YAHOO.util.Event;

CStudioAuthoring.Dialogs = CStudioAuthoring.Dialogs || {};

/**
 * Submit to go live
 */
CStudioAuthoring.Dialogs.DialogSelectContentType = CStudioAuthoring.Dialogs.DialogSelectContentType || {

	/**
	 * initialize module
	 */
	initialize: function(config) {
	},

	changeTemplateCalled : false,
	/**
	 * show dialog
	 */
	showDialog: function(contentTypes, path, asPopup, onSaveCallback, isChangeTemplate) {
		
		/**
		 * indicating, from where showDialog is called (new/change template).
		 */
		CStudioAuthoring.Dialogs.DialogSelectContentType.changeTemplateCalled = isChangeTemplate;  

		this._self = this;

		this.dialog = this.createDialog(path, onSaveCallback);

		this.path = path;
		this.onSaveCallback = onSaveCallback;
		this.asPopup = asPopup;
        this.formSize = null;

		this.updateAvailableTemplates(this.dialog, contentTypes);
		this.setDefaultTemplate(contentTypes);
		this.dialog.show();

		if(0 === contentTypes.length){
			$("#submitWCMPopup").attr("disabled","disabled");
		}
		
        if(window.frameElement){
            var id = window.frameElement.getAttribute("id").split("-editor-")[1];
            this.formSize = parent.getFormSize(id);
            if(this.formSize < 522){
                parent.setFormSize(522, id);
                $($(".studio-ice-container-"+id,parent.document)[0]).attr('data-decrease', true);
            }
        }

	},
	
	/**
	 * hide dialog
	 */
	hideDialog: function() {
		this.dialog.hide();
		this.dialog.destroy();
	},
	
	/**
	 * create dialog
	 */
	createDialog: function(path, selectTemplateCb) {
		YDom.removeClass("cstudio-wcm-popup-div", "yui-pe-content");

        var self = this;
		
		var newdiv = YDom.get("cstudio-wcm-popup-div");
		if (newdiv == undefined) {
			newdiv = document.createElement("div");
			document.body.appendChild(newdiv);
		}

		var divIdName = "cstudio-wcm-popup-div";
        var CMgs = CStudioAuthoring.Messages;
        var formsLangBundle = CStudioAuthoring.Messages.getBundle("forms", CStudioAuthoringContext.lang);
		newdiv.setAttribute("id",divIdName);
		newdiv.className= "yui-pe-content";
		newdiv.innerHTML = '<div class="contentTypePopupInner" id="ct_contentTypePopupInner" style="width:600px;height:501px;">'+
								'<div class="contentTypePopupContent" id="ct_contentTypePopupContent"> '+
									'<form name="contentFromWCM" action=""> '+
									'<div class="contentTypePopupHeader">'+CMgs.format(formsLangBundle, 'chooseContentType')+'</div> '+
									'<div>'+CMgs.format(formsLangBundle, 'chooseContentTypeBody')+'</div> '+
									'<div class="contentTypeOuter"> '+
										'<div class="templateName" id="templateName"> '+
										'<div class="contentTypeDropdown">'+
											'<div>'+CMgs.format(formsLangBundle, 'chooseContentTypeLabel')+'</div><select id="wcm-content-types-dropdown" size="16" class="cstudio-wcm-popup-select-control" style="width:273px; height:275px;"></select> '+
										'</div></div>'+
										'<div class="previewImage" id="previewImage">'+
										'<div class="contentTypePreview">'+
											'<div>'+CMgs.format(formsLangBundle, 'chooseContentTypePreview')+'</div><img src="'+CStudioAuthoringContext.baseUri+'/static-assets/themes/cstudioTheme/images/default-contentType.jpg'+'" id="contentTypePreviewImg" width="267px" height="275px" /> '+
										'</div></div>'+
									'</div> '+
									'<div class="contentTypePopupBtn"> '+
										'<input type="submit" class="btn btn-primary cstudio-xform-button ok" id="submitWCMPopup" value="' +CMgs.format(formsLangBundle, 'ok')+ '" />' +
										'<input type="submit" class="btn btn-default cstudio-xform-button cancel" id="closeWCMPopup" value="' +CMgs.format(formsLangBundle, 'cancel')+ '" />' +
									'</div>'+
									'</form> '+
								'</div> '+
							'</div>';

		document.body.appendChild(newdiv);
		 // Instantiate the Dialog
		content_type_dialog = new YAHOO.widget.Dialog("cstudio-wcm-popup-div",
								{ width : "610px",
								  height : "501px",
								  effect:{
							        effect: YAHOO.widget.ContainerEffect.FADE,
							        duration: 0.25
							      }, 
								  fixedcenter : true,
								  visible : false,
								  modal:true,
								  close:false,
								  constraintoviewport : true,
								  underlay:"none"
								});
                var resizeHandler = new YAHOO.util.Resize("ct_contentTypePopupInner", { proxy:true, minHeight:440, minWidth:600, handles:['br'] });
                resizeHandler.on ("endResize", function() {
                    var dialogObj = this._wrap;
                    if (dialogObj) { try {
                        var dialogWraper = dialogObj.parentNode;
                        if (dialogWraper) {
                            var newWidth = parseInt(dialogObj.style.width, 10);
                            var newHeight = parseInt(dialogObj.style.height, 10);
                            if (newWidth < 600) {
                                newWidth = 600;
                                dialogObj.style.width = "600px";
			    }
                            if (newHeight < 440) {
                                newHeight = 440;
                                dialogObj.style.height = "440px";
			    }
                            dialogWraper.style.width = newWidth + 10 + "px";
                            dialogWraper.style.height = newHeight + 10 + "px";

			    //reset content type drop down and preview image size
                            var widthDiff = parseInt(((newWidth - 600) / 2), 10);
                            var heightDiff = (newHeight - 440);
                            var oDivTmpName = YDom.get("templateName");
                            var oDivPreImg = YDom.get("previewImage");
			    var oContentType = YDom.get("wcm-content-types-dropdown");
                            var oPreviewImage = YDom.get("contentTypePreviewImg");
			    if (oDivTmpName && oDivPreImg && oContentType && oPreviewImage) {
				    oDivTmpName.style.width = 275 + widthDiff + "px";
                                    oDivPreImg.style.width = 275 + widthDiff + "px";
				    oContentType.style.width = 273 + widthDiff + "px";
				    oContentType.style.height = 275 + heightDiff + "px";
				    oPreviewImage.style.width = 267 + widthDiff + "px";
				    oPreviewImage.style.height = 275 + heightDiff + "px";
			    }
                            content_type_dialog.center();
                        }
                    } catch (e) { } }
		});

		// Render the Dialog
		content_type_dialog.render();
        content_type_dialog.cfg.subscribe("configChanged", function (p_sType, p_aArgs) {
            var aProperty = p_aArgs[0],
                    sPropertyName = aProperty[0],
                    oPropertyValue = aProperty[1];
            if (sPropertyName == 'zindex') {
                var siteContextNavZIndex=100000;
                YDom.get("cstudio-wcm-popup-div").parentNode.style.zIndex = oPropertyValue+siteContextNavZIndex;
            }
        });

		var eventParams = {
			self: this
//			path: path,
//			selectTemplateCb: selectTemplateCb			
		};
				
		YAHOO.util.Event.addListener("submitWCMPopup", "click", this.contentPopupSubmit, eventParams);
        //YAHOO.util.Event.addListener("closeWCMPopup", "click", this.closeDialog);
		YAHOO.util.Event.addListener("closeWCMPopup", "click",
                function() {
                    self.contentPopupCancel();

                }
         );

            //set focus on OK Button.
            if (YDom.get("submitWCMPopup")) {
                CStudioAuthoring.Utils.setDefaultFocusOn(YDom.get("submitWCMPopup"));
            }


		$(document).on("keyup", function(e) {
			if (e.keyCode === 27) {	// esc
				self.contentPopupCancel();
				$(document).off("keyup");
			}
		});


		return content_type_dialog;
	},

	setDefaultTemplate: function(contentTypes) {
		var configFilesPath = CStudioAuthoring.Constants.CONFIG_FILES_PATH;
		var contentTypesSelect = YDom.get("wcm-content-types-dropdown");
		if (!contentTypesSelect) return;
		var defaultSrc = CStudioAuthoringContext.baseUri+'/static-assets/themes/cstudioTheme/images/';
		var defaultImg = "default-contentType.jpg";
		var contentTypePreviewImg = YDom.get("contentTypePreviewImg");

		for(var k=0; k<contentTypes.length; k++) {
			if(contentTypesSelect.value == contentTypes[k].form){
				if((contentTypes[k].image && contentTypes[k].image != "") || (contentTypes[k].imageThumbnail && contentTypes[k].imageThumbnail != "" && contentTypes[k].imageThumbnail != "undefined")){
				
				var imageName = (contentTypes[k].image && contentTypes[k].image != "") ? contentTypes[k].image : contentTypes[k].imageThumbnail;

				contentTypePreviewImg.src = 
						CStudioAuthoringContext.baseUri+
						'/api/1/services/api/1/content/get-content-at-path.bin?site=' + CStudioAuthoringContext.site +
						'&path=' + configFilesPath +
						"/content-types" + 
						contentTypesSelect.value + 
						"/"+imageName;					
				}
				else{
					contentTypePreviewImg.src = defaultSrc + defaultImg;
				}
			}
		}
	},
	
	/**
	 * update the content types
	 */
	updateAvailableTemplates: function(dialog, contentTypes) {

		// simple sort for content types, list should be pretty small
	    var swapped;
	    do {
	        swapped = false;
	        for (var i=0; i < contentTypes.length-1; i++) {
	            if (contentTypes[i].label > contentTypes[i+1].label) {
	                var temp = contentTypes[i];
	                contentTypes[i] = contentTypes[i+1];
	                contentTypes[i+1] = temp;
	                swapped = true;
	            }
	        }
	    } while (swapped);


		// handle updates
		var contentTypesSelect = document.getElementById("wcm-content-types-dropdown");    

	    contentTypesSelect.innerHTML = "";

		for(j=0; j<contentTypes.length; j++) {
			var label = contentTypes[j].label;
			var option = document.createElement("option");
			option.text = contentTypes[j].label;
			option.value = contentTypes[j].form;
			if(j == 0 ) option.selected = "selected";//first template will be selected. 
			contentTypesSelect.options.add(option);
		}

		YAHOO.util.Event.addListener("wcm-content-types-dropdown", "change", function(){


			var defaultSrc = CStudioAuthoringContext.baseUri+'/static-assets/themes/cstudioTheme/images/';
			var defaultImg = "default-contentType.jpg";
			var contentTypePreviewImg = YDom.get("contentTypePreviewImg");
			var configFilesPath = CStudioAuthoring.Constants.CONFIG_FILES_PATH;

			for(var k=0; k<contentTypes.length; k++) {
				if(this.value == contentTypes[k].form){
					if((contentTypes[k].image && contentTypes[k].image != "") || (contentTypes[k].imageThumbnail && contentTypes[k].imageThumbnail != "" && contentTypes[k].imageThumbnail != "undefined")){
				
						var imageName = (contentTypes[k].image && contentTypes[k].image != "") ? contentTypes[k].image : contentTypes[k].imageThumbnail;
						
						contentTypePreviewImg.src =
								CStudioAuthoringContext.baseUri+
								'/api/1/services/api/1/content/get-content-at-path.bin?site=' + CStudioAuthoringContext.site +
								'&path=' + configFilesPath +
								"/content-types" +
								contentTypesSelect.value +
								"/"+imageName;
					}
					else{
						contentTypePreviewImg.src = defaultSrc + defaultImg;
					}
				}
			}

			

		});
		
	},
	closeDialog:function() {
        this.dialog.destroy();
    },
	/**
	 * event fired when the ok is pressed
	 */
	contentPopupSubmit: function(event, args) {
		var contentTypesSelect = document.getElementById("wcm-content-types-dropdown");
		var selectedIndex = contentTypesSelect.selectedIndex;
		var selectedType = contentTypesSelect.value;
		/**
		 * EMO-8604, calling closeDialog to remove pop up from DOM.
		 */
		CStudioAuthoring.Dialogs.DialogSelectContentType.closeDialog();
		if(CStudioAuthoring.Dialogs.DialogSelectContentType.changeTemplateCalled == true) {
			CStudioAuthoring.Service.changeContentType(
					CStudioAuthoringContext.site,
					oCurrentTextNode.data.uri,
					selectedType, args.self.onSaveCallback);
		}else {
			args.self.onSaveCallback.success(selectedType);
		}		
	},

	/**
	 * event fired when the cancel is pressed
	 */
	contentPopupCancel: function(event) {
        CStudioAuthoring.Dialogs.DialogSelectContentType.hideDialog();
        if (window.frameElement) {
            var id = window.frameElement.getAttribute("id").split("-editor-")[1];
            if ($($(".studio-ice-container-" + id, parent.document)[0]).height() > this.formSize &&
                $($(".studio-ice-container-" + id, parent.document)[0]).attr('data-decrease')) {

                $($(".studio-ice-container-" + id, parent.document)[0]).height(this.formSize);

            }
        }
    }




};

CStudioAuthoring.Module.moduleLoaded("dialog-select-template", CStudioAuthoring.Dialogs.DialogSelectContentType);
