JSEPackage("JSE.HTML");

JSEImportApi("JSE.HTML.UIComponent");

/**
 * Classe utilitaire pour les HTMElement.
 * @namespace JSE.HTML
 */ 
JSE.HTML = {
	/**
	 * Récupère la position d'un HTMLElement.
	 * Note: Attention le calcul ne marche pas sur des blocs positionnés en float sous IE6.
	 * @param {HTMLElement} obj Elément dont il faut récupérer la position
	 * @return {Array} Position horizontale en index 0 et verticale en index 1
	 */
	findPosition: function (obj) {
		if (obj.offsetParent) {
	  		for (var posX = 0, posY = 0; obj; obj = obj.offsetParent) {
				posX += obj.offsetLeft;
				posY += obj.offsetTop;
			}
			return [posX, posY];
		} else {
			return [obj.x, obj.y];
		}
	},
	/**
	 * Nettoie les propriétés d'un HTMLElement.
	 * @param {HTMLElement} element Elément à nettoyer
	 * @return {void}
	 */
	clear: function (element) {
		var item;
		for (item in element) {
			if ((item != "src") && (item != "innerHTML") && (item != "outerHTML")) {
				try {
					element[item] = "";
				} catch (error) {}
			}
		}
	},	
	/**
	 * Retourne la valeur d'une propriété CSS d'un élément.
	 * @param {HTMLElement} element Elément à inspecter
	 * @param {String} attribute Attribut dont on veut récupérer la valeur
	 * @return {String|Boolean} Valeur de l'attribut | false
	 */
	getStyle: function (element, attribute) {
		var value;
		if(document.defaultView && document.defaultView.getComputedStyle) {
			value = document.defaultView.getComputedStyle(element, '').getPropertyValue(attribute.replace(/[A-Z]/g ,function(match, c){return "-" + match.toLowerCase();}));
		}
		else if (element.currentStyle) {
			value = element.currentStyle[attribute];
		}
		else {
			value = false;
		}
		return value;
	},
	/**
	 * Récupère un noeud enfant de la balise grâce à son id.
	 * @param {String} tag Tag de la balise enfant
	 * @param {String} id Id de la balise enfant
	 * @param {HTMLElement} element Element parent
	 * @return {HTMLElement} Element enfant correspondant à l'id ciblé.
	 */
	getChild: function(tag, id, element) {
		var childs = element.getElementsByTagName(tag),
			len = childs.length;
		for (var i = 0; i < len; i++) {
			if (childs[i].id == id) {
				return childs[i];
			}
		}
	},
	/**
	 * Affiche/masque un HTMLElement.
	 * @param {HTMLElement} element Element à afficher/masquer
	 * @param {String} [display=""] Etat du display quand l'élément est affiché
	 * @return {void}
	 */
	toogleDisplay: function (element, display) {
		if (typeof(display) == "undefined") {
			display = "";
		}
		if (element.style.display == display) {
			element.style.display = "none";
		} else {
			element.style.display = display;
		}
	},
	/**
	 * Remplace la classe d'un élément.
	 * @param {HTMLElement} element Element sur lequel échanger la class
	 * @param {String} firstClass Classe CSS à implémenter dans un premier temps
	 * @param {String} [secondClass=""] Classe CSS à implémenter dans un second temps
	 * @return {void}
	 */
	toogleClass: function (element, firstClass, secondClass) {
		var className = element.className;
		
		if (typeof(secondClass) == "undefined") {
			secondClass = "";
		}
		//firstClass non trouvé
		if (className.indexOf(firstClass) == -1){
			//suppression de secondClass
			if (secondClass != "" && className.indexOf(secondClass) > -1) {
				className = className.replaceAll(secondClass, "");
			}
			//ajout de firstClass
			className += " " + firstClass;
		} else {
			//suppression de firstClass
			if (firstClass != "" && className.indexOf(firstClass) > -1) {
				className = className.replaceAll(firstClass, "");
			}
			//ajout de secondClass
			if (secondClass != "") {
				className += " " + secondClass;
			}
		}
		//Suppression des espaces en début et fin et suppression des espaces doubles
		className = className.replace(/^\s+/,'').replace(/\s+$/,'').replace(/\s{2}/g,' ');
		element.className = className;
	},
	
	/**
	 * Recopie en provenance du JSE Unique du Fwk JS 
	 * Met une classe sur une balise, remplace éventuellement une ancienne
	 */
	replaceClass : function (object, newClass) {
		if ($isDefined(object) && $isDefined(newClass)) {
			object.setAttribute("class", newClass);
			object.setAttribute("className", newClass);
		}
	},
	
	getClassName : function(object) {
		if($isDefined(object)) {
			var objectClass = object.getAttribute("class");
			if (!$isNotEmpty(objectClass)) {
				objectClass = object.getAttribute("className");
			}
			return objectClass;
		}
		return null;
	},
	/**
	 * Indique si une classe est présente dans l'objet
	 * @param {Object} object
	 * @param {String} searchClass
	 */
	isClassExist : function(object, searchClass) {
		var oldClass = object.getAttribute("class");
		if(typeof(oldClass)=="undefined" || oldClass=="" || oldClass==null || oldClass=="null"){
			oldClass = object.getAttribute("className");
		}
		if($isDefined(oldClass)){
			var tab = oldClass.split(" ");
			for(var i=0; i<tab.length; i++){
				if(tab[i] == searchClass){
					return true;
				}
			}
		}
		return false;
	},
	/**
	 * Recopie en provenance du JSE Unique du Fwk JS
	 * Ajoute une classe sur une balise, sans supprimer les anciennes classes
	 */ 
	addClass : function(object, newClass) {
		if($isDefined(object) && $isNotEmpty(newClass)){
			if(!JSE.HTML.isClassExist(object, newClass)){
				var oldClass = object.getAttribute("class");
				if(typeof(oldClass)=="undefined" || oldClass=="" || oldClass==null || oldClass=="null"){
					oldClass = object.getAttribute("className");
				}
				if($isNotEmpty(oldClass)) {
					oldClass+= " ";
				} else {
					oldClass = "";
				}
				oldClass+=newClass;
				oldClass = oldClass.replaceAll("  ", " ");
				
				object.setAttribute("class", oldClass);
				object.setAttribute("className", oldClass);
			}
		}
	},
	/** 
	 * Recopie en provenance du JSE Unique du Fwk JS
	 * Supprime une classe spécifique sur une balise, sans supprimer les autres
	 */
	removeClass : function(object, classToRemove) {
		if($isDefined(object) && $isNotEmpty(classToRemove)){
			var oldClass = JSE.HTML.getClassName(object);
			if($isNotEmpty(oldClass)) {
				var origin = oldClass.split(" ");
				var result = [];
				for(var i=0; i<origin.length; i++){
					if(origin[i] != classToRemove){
						result.push(origin[i]);
					}
				}
				var oldClass = result.join(" ");
				JSE.HTML.replaceClass(object, oldClass);
			}
		}
	},
	/**
	 * Retourne le style à appliquer pour un fond en PNG32.
	 * @param {String} src URL de l'image
	 * @param {String} [sizingMethod=""] Valeur du sizingMethod
	 * @return {String} Style à appliquer à l'élément
	 */
	getPNGBackgroundStyle: function (src, sizingMethod) {
		var sizingMethodStr = (typeof(sizingMethod) == "string")
								? ",sizingMethod='" + sizingMethod + "'"
								: '';
		var styleStr = (navigator.isIE6)
						? "filter:progid:DXImageTransform.Microsoft.AlphaImageLoader(src='" + src + "'" + sizingMethodStr + ");"
						: "background-image:url(" + src + ");";
		return styleStr;
	},
	/**
	 * Affiche correctement un PNG32 en fonction du navigateur.
	 * Méthode à apeller sur le onload d'une balise img.
	 * @param {HTMLElement} img Balise image
	 * @param {String} [sizingMethod=""] Valeur du sizingMethod
	 * @return {void}
	 */
	getPNG: function (img, sizingMethod) {
		img.onload = "";
		var src = img.src;
		img.src = ViaMichelin.Api.Constants.System.ApiImgPath +"all/s.gif";
		if(navigator.isIE6) {
			var sizingMethodStr = (typeof(sizingMethod)=="string")
									? ",sizingMethod='" + sizingMethod + "'" : '';
			img.style.filter = "progid:DXImageTransform.Microsoft.AlphaImageLoader(src='" + src + "'" + sizingMethodStr + ")";
		}
		else {
			img.style.backgroundImage = "url(" + src + ")";
		}
	},
	/**
	 * Affiche correctement un PNG32 en fond d'une balise en fonction du navigateur.
	 * @param {HTMLElement} obj Balise qui contiendra le PNG en fond
	 * @param {String} src URL de l'image
	 * @param {String} [sizingMethod=""] Valeur du sizingMethod
	 * @return {void}
	 */
	loadPNGForBackground: function(obj, src, sizingMethod) {
		var img = document.createElement('img');
		img.obj = obj;
		img.sizingMethod = sizingMethod;
		img.onload = function () {
			if(navigator.isIE6) {
				var sizingMethodStr = (typeof(this.sizingMethod)=="string")
										? ",sizingMethod='" + this.sizingMethod + "'"
										: '';
				obj.style.filter = "progid:DXImageTransform.Microsoft.AlphaImageLoader(src='" + this.src + "'" + sizingMethodStr + ");";
			}
			else {
				obj.style.backgroundImage = "url(" + this.src + ")";
			}
			this.onload = "";
		};
		img.src = src;
	},
	/**
	 * Teste l'existance d'un style dans les feuilles de styles.
	 * @param {String} selector
	 * @return {boolean}
	 */
	isDefinedSelector : function(selector){
		var test = document.createElement("div");
		test.className = selector;
		var tag = null;
		try {
			tag = getComputedStyle(test, null);
		} catch (error) {
		}
		if (tag == null) {
			try {
				tag = document.defaultView.getComputedStyle(test, null);
			} catch (error) {
			}
		}
		if (tag != null) {
			var result = tag.display === "none";
			return result;
		}
		return false;
	},
	getDefinedCss : function (cssName){
	    if (!document.styleSheets) {
	    	return '';
	    }
	    // IE capitalizes html selectors 
	    if (typeof cssName == 'string') {
	    	cssName = RegExp('\\b'+cssName+'\\b','i');
	    }
		var attr, struct;
		var docStyleSheets = document.styleSheets;
		var cpt = docStyleSheets.length;
		var tab = [];
	    while (cpt) {
	    	try {
		        struct = docStyleSheets[--cpt];
		        attr = (struct.rules) ? struct.rules : struct.cssRules;
		        for (var i= 0; i < attr.length; i++){
	                temp = attr[i].selectorText
	                		? [attr[i].selectorText, attr[i].style.cssText]
	                		: [attr[i] + ''];
	                if (cssName.test(temp[0])) {
	                	tab[tab.length] = temp;
	                }
		        }
	    	} catch(e) {
	    		//CSS non accessible (pas finie de charger)
	    	}
	    }
	    return tab.join('\n\n');
	}
};