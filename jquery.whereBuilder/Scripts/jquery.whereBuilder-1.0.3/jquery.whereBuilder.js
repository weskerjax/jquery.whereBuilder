(function($) {
	"use strict";

	var widgetSelector = '.where-builder';
	var addBtnTemplate = '<span class="fa fa-plus fa-lg cursor-pointer" title="增加"></span>';
	
	var $rowTemplate = $(
		'<tr class="hover-visible">' +
		  '<td class="add_btn">且</td>' +
		  '<td class="column"><select class="form-control input-sm"></select><input type="hidden" class="field" /></td>' +
		  '<td class="operator"><select class="form-control input-sm"></select></td>' +
		  '<td class="condition"></td>' +
		  '<td class="delete_btn"><i class="fa fa-times fa-lg text-danger visible-target cursor-pointer" title="刪除"></i></td>' +
		'</tr>'
	);
	
	
	var operatorMap = {
		'':  '=     (等於)',
		'!=': '!=   (不等於)', 
		'..': ' :    (之間)', 
		'<':  '<     (小於)', 
		'<=': '<=   (小於等於)', 
		'>':  '>     (大於)', 
		'>=': '>=   (大於等於)', 
		'in': 'IN   (內容列表)', 
		'!in':'!IN  (非內容列表)', 
		'^=': '^=   (開頭內容等於)', 
		'$=': '$=   (結尾內容等於)', 
		'*=': '*=   (部份內容等於)'
	};

		
	function buildOperator(operatorList){		
		return $.map(operatorList, function(operator){
			var label = operatorMap[operator].replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/ /g, '&nbsp;');	    	
			return '<option value="'+operator+'">'+label+'</option>';
		}).join('');
	}	
		
	
	
	
	/*######################################################*/
	
	var typeHandle = [];

	function getTypeHandle(type) {		
		for (var i = 0; i < typeHandle.length; i++){
			var handle = typeHandle[i](type);
			if(handle != null){ return handle; }
		}
		return typeHandle[0]('string');
	}
	

	/*=[string]====================================*/	
	typeHandle.push(function (type) {
		type = ('' + type).toLowerCase();

		var supportType = ['string', 'char'];
		if ($.inArray(type, supportType) == -1) { return null; }

		return {
			getOperator: function(){
				return buildOperator(['','!=','^=','$=','*=','in','!in']);
			},
			getControl: function(){
				return $('<input type="text" class="form-control input-sm" />');
			},
		};
	});
	 
	/*=[number]====================================*/	
	typeHandle.push(function (type) {
		type = ('' + type).toLowerCase();

		var supportType = ['number', 'decimal', 'float', 'double'];
		if ($.inArray(type, supportType) == -1) { return null; }

		return {
			getOperator: function(){
				return buildOperator(['','!=','..','<','<=','>','>=','in','!in']);
			},
			getControl: function(){
				var $input = $('<input type="text" class="form-control input-sm" />');
				
				$input.keydown(function (e) {
					var val = $.trim(this.value);
					if (e.key == '-' && val) { return false; }
					if (e.key == '.' && ~val.indexOf('.')) { return false; }

					if(e.altKey || e.ctrlKey){ return; }
					if(e.keyCode < 58 || e.keyCode > 90){ return; }
					
					e.preventDefault(); 
				});
				$input.keyup(function(){
					var m = this.value.match(/(-?([0-9]*)?)(\.[0-9]*)?/);
					this.value = m ? m[0] : '';
				});					
				
				return $input;
			},
		};
	});
		   

	/*=[int]====================================*/
	typeHandle.push(function (type) {
		type = ('' + type).toLowerCase();

		var supportType = ['int', 'long', 'short', 'int32', 'int64'];
		if ($.inArray(type, supportType) == -1) { return null; }

		return {
			getOperator: function () {
				return buildOperator(['','!=','..','<','<=','>','>=','in','!in']);
			},
			getControl: function () {
				var $input = $('<input type="text" class="form-control input-sm" />');

				$input.keydown(function (e) {
					var val = $.trim(this.value);
					if (e.key == '-' && val) { return false; }
					if (e.key == '.') { return false; }

					if (e.altKey || e.ctrlKey) { return; }
					if (e.keyCode < 58 || e.keyCode > 90) { return; }

					e.preventDefault();
				});
				$input.keyup(function () {
					var m = this.value.match(/(-?([0-9]*)?)/);
					this.value = m ? m[0] : '';
				});

				return $input;
			},
		};
	});


	/*=[uint]====================================*/
	typeHandle.push(function (type) {
		type = ('' + type).toLowerCase();

		var supportType = ['uint', 'ulong', 'ushort'];
		if ($.inArray(type, supportType) == -1) { return null; }

		return {
			getOperator: function () {
				return buildOperator(['','!=','..','<','<=','>','>=','in','!in']);
			},
			getControl: function () {
				var $input = $('<input type="text" class="form-control input-sm" />');

				$input.keydown(function (e) {
					if (e.key == '.' || e.key == '-') { return false; }

					if (e.altKey || e.ctrlKey) { return; }
					if (e.keyCode < 58 || e.keyCode > 90) { return; }

					e.preventDefault();
				});
				$input.keyup(function () {
					var m = this.value.match(/(([0-9]*)?)/);
					this.value = m ? m[0] : '';
				});

				return $input;
			},
		};
	});



	/*=[date]====================================*/	
	typeHandle.push(function (type) {
		type = ('' + type).toLowerCase();

		var supportType = ['date', 'datetime'];
		if ($.inArray(type, supportType) == -1) { return null; }

		return {
			getOperator: function(){
				return buildOperator(['','!=','..','<','<=','>','>=','in','!in']);
			},
			getControl: function(){
				var $input = $('<input type="text" class="form-control input-sm" />');
				$input.datetimepicker({format:'yyyy-MM-dd', pickTime:false}); 
				
				return $input;
			},
		};
	});
		   
	/*=[items]====================================*/	
	typeHandle.push(function(type){
		var items = {};
		if($.isPlainObject(type)){
			items = type;
		}else if($.isPlainObject(window[type])){
			items = window[type];
		}else{
			try { items = $.parseJSON(type); } 
			catch (e) { console.error(type + ' ' + e); return null; }			
		} 

		var $select = $('<select class="form-control input-sm">');				
		if ($.isArray(items)) {
			$.each(items, function (i, text) {
				$('<option>', { value: text, text: text }).appendTo($select);
			});
		} else {
			$.each(items, function (value, text) {
				$('<option>', { value: value, text: text }).appendTo($select);
			});
		}
		
		return {
			getOperator: function(){
				return buildOperator(['','!=','in','!in']);
			},
			getControl: function(){
				return $select.clone();
			},
		};
	});




		
			
	
	/*######################################################*/
		
	/**
	 * columns = {
	 *      'tntr': { 'label': '課別', 'type': 'string' },
	 *      'gntr': { 'label': '組別', 'type': 'string' },
	 *      'status': { 'label': '狀態', 'type': {'y':'開啟','n':'關閉'} },
	 * }
	 * */
	
	/* class WhereBuilder */
	function WhereBuilder(el, columns) {
		var self = this;
		self.$widget = $(el);
		self.$table = $('<table class="table form-inline where-builder-picker"></table>').appendTo(self.$widget);
		self.columnTotal = 0; 
		self.columns = $.extend({ 
			'': { 'type': '', 'label': '請選擇' } 
		}, columns);
		
		$.each(columns, function(i, meta){
			self.columnTotal++;			 
			meta.handle = getTypeHandle(meta.type);			
		});
		
		self.columnOption = $.map(self.columns, function(meta, column){
			return '<option value="'+column+'">'+meta.label+'</option>';
		}).join('');
		
		self._initField();
		if(self.$table.find('tr').length == 0){ self.addRow(); }
		
		self._initEvent();		
	}
	
	
	
	WhereBuilder.prototype = {
			
		/* 初始化 Field */
		_initField: function() {
			var self = this;
			var qs = location.search.substr(1) || '';
			var raws = qs.split('#')[0].split('&') || [];
			
			/* 拆解 QueryString */
			$.each(raws, function(i, raw) {
				var split = raw.split('=');
				var column = decodeURIComponent(split[0]);
				var value = decodeURIComponent(split[1]);
				if(!self.columns[column]){ return; }
				
				/* 還原 Field */
				self.revertField(self.addRow(), column, value);
			});
		},
		
		
		/* 初始化 Event */
		_initEvent: function() {
			var self = this;
			
			/* 增加 row */
			self.$table.on('click', '.add_btn span', function(){ self.addRow(); });
			
			
			/* 刪除 row */
			self.$table.on('click', '.delete_btn .fa', function(){
				$(this).closest('tr').remove();                
				if(self.$table.find('tr').length == 0){ self.addRow(); }
				self._checkAddBtn();
			});
			

			/* column 只能單選處理 */
			self.$table.on('focus', '.column select', function(){
				
				var hideColumn = self.$table.find('.column select').not(this)
					.map(function(){ return $(this).val() || null; })
					.map(function(){ return '[value="'+this+'"]';  })
					.toArray().join();
					
				$(this).find('option').show().filter(hideColumn).hide();						
			});

			
			/* column 對 operator 的連動 */
			self.$table.on('change', '.column select', function(){
				var $tr = $(this).closest('tr');
				var $cond = $tr.find('.condition').empty();
				var $operator = $tr.find('.operator select').empty();
				
				var column = $(this).val();
				$tr.find('.field').attr('name', column);
				
				var handle = self.columns[column].handle;
				$tr.data('handle', handle);
				if(!handle){ return; }
				
				$cond.html(handle.getControl());
				$operator.html(handle.getOperator());				
				$operator.val('').trigger('change');
			});
				
			
			/* operator 對 condition 連動 */
			self.$table.on('change', '.operator select', function(){
				var $tr = $(this).closest('tr');
				var handle = $tr.data('handle');
				if(!handle){ return; }
								
				var $cond = $tr.find('.condition');
				var $controls = $cond.find(':input');
				var operator = $(this).val();
				$cond.removeClass('more');
				
				/* input [one, two, more] */
				switch (operator) {
				case '..': /* 之間 */
					if($cond.has('.input-group').length > 0){ break; }
					
					var $group = $('<div class="input-group input-group-sm">');
					$group.append(handle.getControl()); 
					$group.append('<span class="input-group-addon">~</span>'); 
					$group.append(handle.getControl()); 
					$cond.html($group);				
					break;
					
				case 'in': /* 內容列表 */
				case '!in': /* 非內容列表 */
					$cond.addClass('more');
					if($cond.has('.input-group').length > 0){ 
						$cond.html(handle.getControl()); /*重建*/
					}else{
						$cond.find(':input').trigger('change');
					}
					break;
					
				default:
					if($controls.length == 1){ break; }				
					$cond.html(handle.getControl()); /*多數重建*/
					break;
				}                
			});
			
			
			/* 自動增加 condition 欄位 */
			self.$table.on('change', '.condition.more', function(){
				var $tr = $(this).closest('tr');
				var handle = $tr.data('handle');
								
				var $cond = $(this);
				$cond.find(':input').each(function(){
					if(!$(this).val().trim()){ $(this).remove(); }
				});
				$cond.append(handle.getControl().val(''));
			});
			
			
			/* 計算 Field */
			self.$table.on('change keyup', 'tr', function(){
				self.computeField($(this)); 
			});
		},
		
		
		/* 檢查增加按鈕 */
		_checkAddBtn: function() {
			var self = this;
			var rowCount = self.$table.find('tr').length;
			var $firstAddBtn = self.$table.find('tr:first-child .add_btn');
			
			if(rowCount >= self.columnTotal){ 
				$firstAddBtn.html(''); 
			}else{
				$firstAddBtn.html(addBtnTemplate);					
			}
		},        
		
		
		/* 增加 row */
		addRow: function() {
			var self = this;
			var $tr = $rowTemplate.clone();
			$tr.find('.column select').html(self.columnOption);     
			$tr.appendTo(self.$table);
			self._checkAddBtn();
			return $tr;
		},
		

		/* 還原 Field */
		revertField: function($tr, column, value) {
			var self = this;			
			var meta = self.columns[column];
			if(!meta || !meta.handle){ return; }
			
			var handle = meta.handle;
			$tr.data('handle', handle);
			$tr.find('.column select').val(column);
			$tr.find('.field').attr('name', column).val(value);
			
			var $cond = $tr.find('.condition');
			var $operator = $tr.find('.operator select');
			$operator.html(handle.getOperator());
			
			var operator = value.substr(0,2);
			if(~$.inArray(operator, ['!=','<=','>=','^=','*=','$='])){
				$operator.val(operator);
				handle.getControl().val(value.substr(2)).appendTo($cond);
				return; 
			}
			
			var operator = value.substr(0,1);
			if(~$.inArray(operator, ['=','<','>'])){
				$operator.val(operator);
				handle.getControl().val(value.substr(1)).appendTo($cond);
				return; 
			}

			var split = value.split('..');
			if(split.length == 2){
				$operator.val('..');
				
				var $group = $('<div class="input-group input-group-sm">');
				$group.append(handle.getControl().val(split[0])); 
				$group.append('<span class="input-group-addon">~</span>'); 
				$group.append(handle.getControl().val(split[1])); 
				$cond.html($group);
				return; 
			}
			
			var split = value.split('|');
			if(split.length > 1){
				if(split[0].charAt(0) == '!'){
					$operator.val('!in');
					split[0] = split[0].substr(1);
				}else{
					$operator.val('in');
				}
			
				split.push('');
				$.each(split, function(i, value){
					handle.getControl().val(value).appendTo($cond);
				});                               
				$cond.addClass('more');
				return; 
			}
			
			handle.getControl().val(value).appendTo($cond);
		},    
		
		
		/* 計算 Field */
		computeField: function($tr) {
			var operator = $tr.find('.operator select').val();
			var $input = $tr.find('.condition :input');
			
			var value = operator + $input.val();
			switch (operator) {
			case '..': /* 之間 */
				value = $input.map(function(){ return $.trim(this.value); }).toArray().join('..');
				break;
				
			case 'in': /* 內容列表 */
			case '!in': /* 非內容列表 */
				value = $input.map(function(){ return $.trim(this.value) || null; }).toArray().join('|');
				if('!in' == operator){ value = '!'+value; }
				break;
			}
			
			$tr.find('.field').val(value);
		}       
	};
	
	
	
	$.fn.whereBuilder = function(columns) {
		var args = Array.prototype.slice.call(arguments, 1);

		if (typeof(columns) === 'string') {
			var $el = this.eq(0);
			var instance = $el.data('WhereBuilder');
			if(instance && $.isFunction(instance[columns])){ 
				return instance[columns].apply(instance, args);
			} 
			return instance;
		} 
		
		return this.each(function () {
			var $el = $(this);
			var instance = $el.data('WhereBuilder');
			if(instance){ return; }
			
			instance = new WhereBuilder(this, columns);
			$el.data('WhereBuilder', instance);
		});
	};
	
	
	
	/* unobtrusive API */
	jQuery(function($) {
		$(widgetSelector).each(function () {
			var columns = {};
			$(this).find('option').each(function(){
				var $this = $(this);
				columns[$this.val()] = {
					'type': $this.attr('type') || 'string', 
					'label': $this.html() || $this.val()
				};
			});
			
			$(this).parent().whereBuilder(columns);
		});
	});
	
})(window.jQuery);
