(function ($) {
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
		'': '=     (等於)',
		'!=': '!=   (不等於)',
		'..': '~    (之間)',
		'<': '<     (小於)',
		'<=': '<=   (小於等於)',
		'>': '>     (大於)',
		'>=': '>=   (大於等於)',
		'in': 'IN   (內容列表)',
		'!in': '!IN  (非內容列表)',
		'^=': '^=   (開頭內容等於)',
		'$=': '$=   (結尾內容等於)',
		'*=': '*=   (部份內容等於)'
	};


	function buildOperator(operatorList) {
		return $.map(operatorList, function (operator) {
			var label = operatorMap[operator].replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/ /g, '&nbsp;');
			return '<option value="' + operator + '">' + label + '</option>';
		}).join('');
	}

	function makeOptions(items) {
		var isObject = !$.isArray(items);
		return $.map(items, function (item, value) {
			if (isObject) {
				return { value: value, text: item };
			} else if ($.isArray(item)) {
				return { value: item[0], text: item[1] };
			} else {
				return { value: item, text: item };
			}
		});
	}


	function createInput(setting) {
		var $input = $('<input type="text" class="form-control input-sm" />');
		if (setting) { setting($input); }

		$input.focus(function () { this.select(); });
		return $input;
	}

	function createTextarea(setting) {
		var $input = $('<textarea class="form-control input-sm" placeholder="多筆查詢一行一個"></textarea>');
		if (setting) { setting($input); }

		$input.bind({
			'focus': function () {
				this.select();
			},
			'change': function () {
				var uniqueSet = {};
				$.each($(this).val().split(/\s/), function (i, value) {
					uniqueSet[$.trim(value)] = 1;
				});

				var values = $.map(uniqueSet, function (i, value) { return value; });
				$(this).val(values.join('\n'));
			},
			'init change keyup paste cut': function (e) {
				$(this).height(0).height($(this).prop("scrollHeight") + 10);
			},
		});

		return $input;
	}

	function createSelect(options) {
		var $select = $('<select class="form-control input-sm">');
		$.tmpl('<option value="${value}">${text}</option>', options).appendTo($select);
		return $select;
	}


	function createCheckbox(options) {
		var $select = $('<div class="form-control options">');
		$.tmpl('<label class="checkbox-inline"><input type="checkbox" value="${value}"/>${text}</label>', options).appendTo($select);
		return $select;
	}

	function createRadio(options) {
		var $select = $('<div class="form-control options">');
		$.tmpl('<label class="radio-inline"><input type="radio" value="${value}"/>${text}</label>', options).appendTo($select);

		var $input = $select.find(':input');
		$input.on('init change', function () { $input.not(this).prop('checked', false); })
		$input.first().prop('checked', true);

		return $select;
	}



	function addYear(dateStr, num) {
		if (!dateStr) { return ''; }

		return dateStr.replace(/^[0-9]+\b/, function (year) {
			return parseInt(year, 10) + num;
		});
	}



	/*######################################################*/

	var typeHandles = [];

	function getTypeHandle(type) {
		for (var i = 0; i < typeHandles.length; i++) {
			var handle = typeHandles[i](type);
			if (handle != null) { return handle; }
		}
		return typeHandles[0]('string');
	}

	var baseHandle = {
		//_inputSetting: function ($input) {},
		//getOperator: function () {},
		setControl: function ($cond, mod) { /* input [single, between, multiple] */
			switch (mod) {
				case 'between': /* 之間 */
					var $group = $('<div class="input-group input-group-sm">');
					$group.append(createInput(this._inputSetting));
					$group.append('<span class="input-group-addon">~</span>');
					$group.append(createInput(this._inputSetting));
					$cond.html($group);
					break;
				case 'multiple':
					$cond.html(createTextarea(this._inputSetting));
					break;
				default:
					$cond.html(createInput(this._inputSetting));
					break;
			}
		},
		revertControl: function ($cond, mod, values) {
			this.setControl($cond, mod);
			var $input = $cond.find(':input');

			switch (mod) {
				case 'between': /* 之間 */
					$input.eq(0).val(values[0]);
					$input.eq(1).val(values[1]);
					break;
				case 'multiple':
					$input.val(values.join('\n')).trigger('init');
					break;
				default:
					$input.val(values.join(' '));
					break;
			}
		},
		getValues: function ($cond, mod) {
			var $input = $cond.find(':input');

			if (mod === 'multiple') {
				return $input.val().split(/\s/);
			} else {
				return $input.map(function () { return $.trim($(this).val()); }).toArray();
			}
		}
	};




	/*=[divider 分隔線]====================================*/

	typeHandles.push(function (type) {
		type = ('' + type).toLowerCase();

		var supportType = ['divider'];
		if ($.inArray(type, supportType) === -1) { return null; }

		return {
			getOperator: function () { return ''; },
			setControl: baseHandle.setControl,
			revertControl: baseHandle.revertControl,
			getValues: baseHandle.getValues
		};
	});



	/*=[string]====================================*/

	typeHandles.push(function (type) {
		type = ('' + type).toLowerCase();

		var supportType = ['string', 'char'];
		if ($.inArray(type, supportType) === -1) { return null; }


		return {
			getOperator: function () {
				return buildOperator(['', '!=', '^=', '$=', '*=', '<', '<=', '>', '>=', 'in', '!in']);
			},
			setControl: baseHandle.setControl,
			revertControl: baseHandle.revertControl,
			getValues: baseHandle.getValues
		};
	});



	/*=[upper]====================================*/
	typeHandles.push(function (type) {
		type = ('' + type).toLowerCase();

		var supportType = ['upper'];
		if ($.inArray(type, supportType) === -1) { return null; }

		return {
			_inputSetting: function ($input) {
				$input.css('text-transform', 'uppercase');
				$input.change(function () { this.value = this.value.toUpperCase(); });
			},
			getOperator: function () {
				return buildOperator(['', '!=', '^=', '$=', '*=', '<', '<=', '>', '>=', 'in', '!in']);
			},
			setControl: baseHandle.setControl,
			revertControl: baseHandle.revertControl,
			getValues: baseHandle.getValues
		};
	});



	/*=[number]====================================*/
	typeHandles.push(function (type) {
		type = ('' + type).toLowerCase();

		var supportType = ['number', 'decimal', 'float', 'double'];
		if ($.inArray(type, supportType) === -1) { return null; }


		return {
			_inputSetting: function ($input) {
				$input.keydown(function (e) {
					if (e.altKey || e.ctrlKey) { return; }
					if (e.keyCode < 58 || e.keyCode > 90) { return; }

					e.preventDefault();
				});
				$input.change(function () {
					var m = this.value.match(/(-?[\.0-9]+)/gm);
					this.value = m ? m.join('\n') : '';
				});
			},
			getOperator: function () {
				return buildOperator(['', '!=', '..', '<', '<=', '>', '>=', 'in', '!in']);
			},
			setControl: baseHandle.setControl,
			revertControl: baseHandle.revertControl,
			getValues: baseHandle.getValues
		};
	});


	/*=[int]====================================*/
	typeHandles.push(function (type) {
		type = ('' + type).toLowerCase();

		var supportType = ['int', 'long', 'short', 'int32', 'int64'];
		if ($.inArray(type, supportType) === -1) { return null; }


		return {
			_inputSetting: function ($input) {
				$input.keydown(function (e) {
					if (e.key === '.') { return false; }
					if (e.altKey || e.ctrlKey) { return; }
					if (e.keyCode < 58 || e.keyCode > 90) { return; }

					e.preventDefault();
				});
				$input.change(function () {
					var m = this.value.match(/(-?[0-9]+)/gm);
					this.value = m ? m.join('\n') : '';
				});
			},
			getOperator: function () {
				return buildOperator(['', '!=', '..', '<', '<=', '>', '>=', 'in', '!in']);
			},
			setControl: baseHandle.setControl,
			revertControl: baseHandle.revertControl,
			getValues: baseHandle.getValues
		};
	});





	/*=[uint]====================================*/
	typeHandles.push(function (type) {
		type = ('' + type).toLowerCase();

		var supportType = ['uint', 'ulong', 'ushort'];
		if ($.inArray(type, supportType) === -1) { return null; }


		return {
			_inputSetting: function ($input) {
				$input.keydown(function (e) {
					if (e.key === '.' || e.key === '-') { return false; }

					if (e.altKey || e.ctrlKey) { return; }
					if (e.keyCode < 58 || e.keyCode > 90) { return; }

					e.preventDefault();
				});
				$input.change(function () {
					var m = this.value.match(/([0-9]+)/gm);
					this.value = m ? m.join('\n') : '';
				});
			},
			getOperator: function () {
				return buildOperator(['', '!=', '..', '<', '<=', '>', '>=', 'in', '!in']);
			},
			setControl: baseHandle.setControl,
			revertControl: baseHandle.revertControl,
			getValues: baseHandle.getValues
		};
	});



	/*=[date]====================================*/
	typeHandles.push(function (type) {
		type = ('' + type).toLowerCase();

		var supportType = ['date'];
		if ($.inArray(type, supportType) === -1) { return null; }

		return {
			_inputSetting: function ($input) {
				$input.datetimepicker({ format: 'yyyy-MM-dd', pickTime: false });
				if (!$input.is('textarea')) { return; }

				$input.on('dp.change', function (e) {
					var orgValue = $.trim($input.val());
					if (orgValue) { orgValue += '\n'; }

					$input.val(orgValue + moment(e.date).format("YYYY-MM-DD"));
					$input.data('DateTimePicker').show();
				});
			},
			getOperator: function () {
				return buildOperator(['', '!=', '..', '<', '<=', '>', '>=', 'in', '!in']);
			},
			setControl: baseHandle.setControl,
			revertControl: baseHandle.revertControl,
			getValues: baseHandle.getValues
		};
	});



	/*=[datetime]====================================*/
	typeHandles.push(function (type) {
		type = ('' + type).toLowerCase();

		var supportType = ['datetime'];
		if ($.inArray(type, supportType) === -1) { return null; }

		return {
			_inputSetting: function ($input) {
				$input.datetimepicker({ format: 'yyyy-MM-dd', pickTime: false });
			},
			getOperator: function () {
				return buildOperator(['', '..', '<', '<=', '>', '>=']);
			},
			setControl: baseHandle.setControl,
			revertControl: function ($cond, mod, values) {
				values[0] = (values[0] || '').split(' ')[0];
				values[1] = (values[1] || '').split(' ')[0];

				if (values[0] == values[1]) {
					mod = 'single';
					$cond.data('mod', mod);
					$cond.closest('tr').find('.operator select').val('');
				}

				this.setControl($cond, mod);
				var $input = $cond.find(':input');

				$input.eq(0).val(values[0]);
				$input.eq(1).val(values[1]);
			},
			getValues: function ($cond, mod) {
				var operator = $cond.closest('tr').find('.operator select').val();

				var values = $cond.find(':input').map(function () { return $.trim($(this).val()); }).toArray();
				switch (operator) {
					case '':
						values[0] = values[0] + '..' + values[0] + ' 23:59:59.999';
						break;
					case '<=':
					case '>':
						values[0] += ' 23:59:59.999';
						break;
					case '..': /* 之間 */
						values[1] += ' 23:59:59.999';
						break;
				}

				return values;
			}
		};
	});







	/*=[cndate]====================================*/
	typeHandles.push(function (type) {
		type = ('' + type).toLowerCase();

		var supportType = ['cndate'];
		if ($.inArray(type, supportType) === -1) { return null; }

		return {
			_inputSetting: function ($input) {
				$input.datetimepicker({
					format: 'yyyy-MM-dd',
					pickTime: false,
					transferOutYear: function (year) { return year - 1911; },
					transferInDate: function (dateStr) {
						return addYear(dateStr, 1911);
					}
				});
				if (!$input.is('textarea')) { return; }

				$input.on('dp.change', function (e) {
					var orgValue = $.trim($input.val());
					if (orgValue) { orgValue += '\n'; }

					var dateStr = moment(e.date).format("YYYY-MM-DD");
					$input.val(orgValue + addYear(dateStr, -1911));
					$input.data('DateTimePicker').show();
				});
			},
			getOperator: function () {
				return buildOperator(['', '!=', '..', '<', '<=', '>', '>=', 'in', '!in']);
			},
			setControl: baseHandle.setControl,
			revertControl: function ($cond, mod, values) {
				var cnValues = $.map(values, function (dateStr) {
					return addYear(dateStr, -1911);
				});

				baseHandle.revertControl($cond, mod, cnValues);
			},
			getValues: function ($cond, mod) {
				var values = baseHandle.getValues($cond, mod);

				return $.map(values, function (dateStr) {
					return addYear(dateStr, 1911);
				});
			}
		};
	});



	/*=[cndatetime]====================================*/
	typeHandles.push(function (type) {
		type = ('' + type).toLowerCase();

		var supportType = ['cndatetime'];
		if ($.inArray(type, supportType) === -1) { return null; }


		return {
			_inputSetting: function ($input) {
				$input.datetimepicker({
					format: 'yyyy-MM-dd',
					pickTime: false,
					transferOutYear: function (year) { return year - 1911; },
					transferInDate: function (dateStr) {
						return addYear(dateStr, 1911);
					}
				});
			},
			getOperator: function () {
				return buildOperator(['..', '<', '<=', '>', '>=']);
			},
			setControl: baseHandle.setControl,
			revertControl: function ($cond, mod, values) {
				var cnValues = $.map(values, function (dateStr) {
					return addYear(dateStr, -1911);
				});

				baseHandle.revertControl($cond, mod, cnValues);
			},
			getValues: function ($cond, mod) {
				var values = baseHandle.getValues($cond, mod);

				return $.map(values, function (dateStr) {
					return addYear(dateStr, 1911);
				});
			}
		};
	});




	/*=[bool]====================================*/
	typeHandles.push(function (type) {
		type = ('' + type).toLowerCase();

		var supportType = ['bool'];
		if ($.inArray(type, supportType) === -1) { return null; }

		return getTypeHandle('{"True":"是","False":"否"}');
	});



	/*=[items]====================================*/
	typeHandles.push(function (type) {
		var items = {};
		if ($.isPlainObject(type)) {
			items = type;
		} else if (window[type] !== undefined) {
			items = window[type];
		} else {
			var jsonStr = type;
			if (jsonStr[0] == '{') {
				jsonStr = jsonStr.replace(/(["']?\w+["']?):(["'](?:\.|(\\")|(\\')|[^"'])*["'])/ig, '[$1,$2]');
				jsonStr = jsonStr.replace(/^{/, '[').replace(/}$/, ']');
			}
			try { items = $.parseJSON(jsonStr); }
			catch (e) { console.error(jsonStr + ' ' + e); return null; }
		}


		var options = makeOptions(items);

		if (options.length < 3) {
			return {
				getOperator: function () {
					return buildOperator(['']);
				},
				setControl: function ($cond, mod) { /* input [single, between, multiple] */
					$cond.html(createRadio(options));
				},
				revertControl: function ($cond, mod, values) {
					this.setControl($cond, mod);
					$cond.find(':input').prop('checked', function () { return this.value === values[0]; });
				},
				getValues: function ($cond, mod) {
					var values = $cond.find(':input:checked').map(function () { return $.trim($(this).val()); }).toArray();
					values.push('');
					return values;
				}
			};
		}
		else {
			return {
				getOperator: function () {
					return buildOperator(['', '!=', 'in', '!in']);
				},
				setControl: function ($cond, mod) { /* input [single, between, multiple] */
					if (mod === 'multiple') {
						$cond.html(createCheckbox(options));
					} else {
						$cond.html(createSelect(options));
					}
				},
				revertControl: function ($cond, mod, values) {
					this.setControl($cond, mod);
					var $input = $cond.find(':input');

					if (mod === 'multiple') {
						$input.prop('checked', function () { return ~$.inArray(this.value, values); });
					} else {
						$input.val(values[0]);
					}
				},
				getValues: function ($cond, mod) {
					var $input = $cond.find(':input');

					if (mod === 'multiple') { $input = $input.filter(':checked'); }
					return $input.map(function () { return $.trim($(this).val()); }).toArray();
				}
			};
		}
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

		$.each(columns, function (i, meta) {
			self.columnTotal++;
			meta.handle = getTypeHandle(meta.type);
		});

		self.columnOption = $.map(self.columns, function (meta, column) {
			if (meta.type == 'divider') {
				return '<option disabled>────────</option>';
			} else {
				return '<option value="' + column + '">' + meta.label + '</option>';
			}
		}).join('');

		self._initField();
		if (self.$table.find('tr').length === 0) { self.addRow(); }

		self._initEvent();
	}

	WhereBuilder.buildOperator = buildOperator;
	WhereBuilder.baseHandle = baseHandle;
	WhereBuilder.typeHandles = typeHandles;


	WhereBuilder.prototype = {

		/* 初始化 Field */
		_initField: function () {
			var self = this;
			var qs = location.search.substr(1) || '';
			var raws = qs.split('#')[0].split('&') || [];

			/* 拆解 QueryString */
			$.each(raws, function (i, raw) {
				var split = raw.replace('+', ' ').split('=');
				var column = decodeURIComponent(split[0]);
				if (!self.columns[column]) { return; }

				var value = '';
				try { value = decodeURIComponent(split[1]); }
				catch (e) { value = unescape(split[1]); }

				/* 還原 Field */
				self.revertField(self.addRow(), column, value);
			});
		},


		/* 初始化 Event */
		_initEvent: function () {
			var self = this;

			/* 增加 row */
			self.$table.on('click', '.add_btn span', function () { self.addRow(); });


			/* 刪除 row */
			self.$table.on('click', '.delete_btn .fa', function () {
				$(this).closest('tr').remove();
				if (self.$table.find('tr').length === 0) { self.addRow(); }
				self._checkAddBtn();
			});


			/* column 只能單選處理 */
			self.$table.on('focus', '.column select', function () {

				var hideColumn = self.$table.find('.column select').not(this)
					.map(function () { return $(this).val() || null; })
					.map(function () { return '[value="' + this + '"]'; })
					.toArray().join();

				$(this).find('option').show().filter(hideColumn).hide();
			});


			/* column 對 operator 的連動 */
			self.$table.on('change', '.column select', function () {
				var $tr = $(this).closest('tr');
				var $operator = $tr.find('.operator select').empty();

				var column = $(this).val();
				$tr.find('.field').attr('name', column);

				var handle = self.columns[column].handle || null;
				$tr.data('handle', handle);
				if (!handle) { return $operator.val('').trigger('change'); }

				$tr.find('.condition').data('mod', '');
				$operator.html(handle.getOperator());
				$operator.val('').trigger('change');
			});


			/* operator 對 condition 連動 */
			self.$table.on('change', '.operator select', function () {
				var $tr = $(this).closest('tr');
				var $cond = $tr.find('.condition');
				var handle = $tr.data('handle');				
				if (!handle) { return $cond.html(''); }

				var mod = $cond.data('mod');
				var operator = $(this).val();

				/* input [single, between, multiple] */
				switch (operator) {
					case '..': /* 之間 */
						if (mod === 'between') { return; }
						mod = 'between';
						break;

					case 'in': /* 內容列表 */
					case '!in': /* 非內容列表 */
						if (mod === 'multiple') { return self.computeField($tr); }
						mod = 'multiple';
						break;

					default:
						if (mod === 'single') { return self.computeField($tr); }
						mod = 'single';
						break;
				}

				handle.setControl($cond, mod);
				$cond.data('mod', mod);
			});



			/* 計算 Field */
			self.$table.on('change', 'tr', function () {
				self.computeField($(this));
			});
		},


		/* 檢查增加按鈕 */
		_checkAddBtn: function () {
			var self = this;
			var rowCount = self.$table.find('tr').length;
			var $firstAddBtn = self.$table.find('tr:first-child .add_btn');

			if (rowCount >= self.columnTotal) {
				$firstAddBtn.html('');
			} else {
				$firstAddBtn.html(addBtnTemplate);
			}
		},


		/* 增加 row */
		addRow: function () {
			var self = this;
			var $tr = $rowTemplate.clone();
			$tr.find('.column select').html(self.columnOption);
			$tr.appendTo(self.$table);
			self._checkAddBtn();
			return $tr;
		},


		/* 還原 Field */
		revertField: function ($tr, column, value) {
			var self = this;
			var meta = self.columns[column];
			if (!meta || !meta.handle) { return; }

			var handle = meta.handle;
			$tr.data('handle', handle);
			$tr.find('.column select').val(column);
			$tr.find('.field').attr('name', column).val(value);

			var $operator = $tr.find('.operator select');
			$operator.html(handle.getOperator());

			var operator = value.substr(0, 2);
			var mod = 'single';
			var values = [value];

			do {
				if (~$.inArray(operator, ['!=', '<=', '>=', '^=', '*=', '$='])) {
					$operator.val(operator);
					values = [value.substr(2)];
					break;
				}

				operator = value.substr(0, 1);
				if (~$.inArray(operator, ['=', '<', '>'])) {
					$operator.val(operator);
					values = [value.substr(1)];
					break;
				}

				var split = value.split('..');
				if (split.length === 2) {
					$operator.val('..');
					mod = 'between';
					values = split;
					break;
				}

				split = value.split('|');
				if (split.length > 1) {
					if (split[0].charAt(0) === '!') {
						$operator.val('!in');
						split[0] = split[0].substr(1);
					} else {
						$operator.val('in');
					}
					mod = 'multiple';
					values = split;
					break;
				}
			} while (false);


			var $cond = $tr.find('.condition');
			$cond.data('mod', mod);
			handle.revertControl($cond, mod, values);
		},


		/* 計算 Field */
		computeField: function ($tr) {
			var $cond = $tr.find('.condition');
			var handle = $tr.data('handle');
			if (!handle) { return $tr.find('.field').val(''); }
			
			var operator = $tr.find('.operator select').val();
			var values = handle.getValues($cond, $cond.data('mod'));
			var value = operator + values[0];
			switch (operator) {
				case '..': /* 之間 */
					value = values.join('..');
					break;

				case 'in': /* 內容列表 */
				case '!in': /* 非內容列表 */
					value = values.join('|') + '|';
					if ('!in' === operator) { value = '!' + value; }
					break;
			}

			$tr.find('.field').val(value);
		}
	};



	$.fn.whereBuilder = function (columns) {
		var args = Array.prototype.slice.call(arguments, 1);

		if (typeof (columns) === 'string') {
			var $el = this.eq(0);
			var instance = $el.data('WhereBuilder');
			if (instance && $.isFunction(instance[columns])) {
				return instance[columns].apply(instance, args);
			}
			return instance;
		}

		return this.each(function () {
			var $el = $(this);
			var instance = $el.data('WhereBuilder');
			if (instance) { return; }

			instance = new WhereBuilder(this, columns);
			$el.data('WhereBuilder', instance);
		});
	};



	/* unobtrusive API */
	jQuery(function ($) {
		$(widgetSelector).each(function () {
			var columns = {};
			$(this).find('option').each(function () {
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
