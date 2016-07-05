(function($) {
    "use strict";

    var widgetSelector = '.where-builder';
    var addBtnTemplate = '<span class="btn btn-default btn-xs btn-icon" title="增加"><i class="fa fa-plus fa-lg"></i></span>';
    var deleteBtnTemplate = '<i class="fa fa-times fa-lg text-danger visible-target cursor-pointer" title="刪除"></i>';
    var inputTemplate = '<input type="text" class="form-control input-sm" />';
    
    var $rowTemplate = $(
        '<tr class="hover-visible">' +
          '<td class="add_btn"></td>' +
          '<td class="column"><select class="form-control input-sm"></select><input type="hidden" class="field" /></td>' +
          '<td class="operator"><select class="form-control input-sm"></select></td>' +
          '<td class="condition"><input type="text" class="form-control input-sm" /></td>' +
          '<td class="delete_btn"></td>' +
        '</tr>'
    );
    
    
    var operatorTemplate = $.map({
        '':   '',
        '=':  '=     (等於)',
        '!=': '!=   (不等於)', 
        '..': ' :    (之間)', 
        '<':  '<     (小於)', 
        '<=': '<=   (小於等於)', 
        '>':  '>     (大於)', 
        '>=': '>=   (大於等於)', 
        'in': 'IN   (內容列表)', 
        '!in':'!IN  (非內容列表)', 
        '^=': '^=   (開頭內容等於)', 
        '*=': '*=   (部份內容等於)'
    }, function(label, operator){
        label = label.replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/ /g,'&nbsp;');
        return '<option value="'+operator+'">'+label+'</option>';
    }).join('');
        
    
    function makeIgnore(ignores) {
        return $.map(ignores,function(n){return '[value="'+n+'"]'; }).join();
    }
    var typeIgnore = {
        'string': '',
        'date':   makeIgnore(['in','!in','^=','*=']),
        'number': makeIgnore(['*=']),
    };  
        

    
    
    /* class WhereBuilder */
    function WhereBuilder(el, columns) {
        var self = this;
        self.$widget = $(el);
        self.$table = $('<table class="table form-inline where-builder-picker"></table>').appendTo(self.$widget);
        self.columns = columns;
        
        $.each(columns, function(i, meta){
            meta.ignore = typeIgnore[meta.type] || typeIgnore['string'];
        });
        
        self.columnOption = '<option value="">請選擇</option>';
        self.columnOption += $.map(columns, function(meta, column){
            return '<option value="'+column+'">'+meta.label+'</option>';
        }).join('');
        
        self.initField();
        if(self.$table.find('tr').length == 0){
            self.addRow();
        }
        
        self.initEvent();
    }
    
    
    
    WhereBuilder.prototype = {
            
        /* 初始化 Field */
        initField: function() {
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
        initEvent: function() {
            var self = this;
            
            /* 增加 row */
            self.$table.on('click', '.add_btn .btn', function(){ self.addRow(); });
            
            /* 刪除 row */
            self.$table.on('click', '.delete_btn .fa', function(){
                var $tr = $(this).closest('tr');
                
                if($tr.is(':only-child')){
                	$tr.find('.column select, .operator select, .condition input').val('');
                }else if($tr.is(':first-child')){
                	$tr.next().find('.add_btn').html(addBtnTemplate);	
                	$tr.remove();     
                }else{
                	$tr.remove();     
                }
            });
            
            
            /* column 對 operator 的連動 */
            self.$table.on('change', '.column select', function(){
                var $tr = $(this).closest('tr');
                var $sel = $tr.find('.operator select');
                var $opt = $tr.find('.operator option');
                var column = $(this).val();
                var meta = self.columns[column];
                
                $tr.data('type', meta.type);
                $tr.find('.field').attr('name', column);
                
                $opt.prop('disabled',false);
                $opt.filter(meta.ignore).prop('disabled',true);
                $sel.val($sel.val()).trigger('change');
            });
                
            
            /* operator 對 condition 連動 */
            self.$table.on('change', '.operator select', function(){
                var $tr = $(this).closest('tr');
                var $cond = $tr.find('.condition');
                var operator = $(this).val();
                $cond.find('input').removeClass('two more');
                
                /* input [one, two, more] */
                switch (operator) {
                case '..': /* 之間 */
                    if($cond.find('input').length < 2){
                        $cond.append(inputTemplate);
                    }else{
                        $cond.find('input:gt(1)').remove();
                    }
                    $cond.find('input').addClass('two');
                    break;
                    
                case 'in': /* 內容列表 */
                case '!in': /* 非內容列表 */
                    $cond.find('input').addClass('more').trigger('change');
                    break;
                    
                default:
                    $cond.find('input:gt(0)').remove();
                    break;
                }
                
                $cond.find('input').attr('assist-type', operator ? $tr.data('type') : '');
            });
            

            /* condition 欄位型態 */
            self.$table.on('focus', '.condition input', function(){
                var $this = $(this);
                
                /* 解除原本的型態處理 */
                var datePicker = $this.data('DateTimePicker');
				if(datePicker){ datePicker.destroy(); }	
				$this.off('keydown keyup');
            	
				/* 增加型態處理 */
            	switch ($this.attr('assist-type')) {
				case 'date':
					$this.datetimepicker({format:'yyyy-MM-dd', pickTime:false}); 
					break;
				case 'number':
					$this.keydown(function(e){    
						if(e.altKey || e.ctrlKey){ return; }
						if(e.keyCode < 58 || e.keyCode > 90){ return; }
						
				    	var val = $.trim(this.value);
				    	if(e.key == '-' && !val){ return; } 
				    	if(e.key == '.' && val.indexOf('.') == -1){ return; } 
				    	e.preventDefault(); 
				   	});
					$this.keyup(function(){
				    	var m = this.value.match(/(-?([0-9]*)?)(\.[0-9]*)?/);
				    	this.value = m ? m[0] : '';
				    });					
					break;
				}
            });
            
            
            /* 自動增加 condition 欄位 */
            self.$table.on('change', '.condition .more', function(){
                var $cond = $(this).parent();
                $cond.find('.more').each(function(){
                    if(!$(this).val().trim()){ $(this).remove(); }
                });
                $(inputTemplate).addClass('more').appendTo($cond);
            });
            
            
            /* 計算 Field */
            self.$table.on('change keyup', 'tr', function(){
                self.computeField($(this)); 
            });
        },
        
        
        /* 增加 row */
        addRow: function() {
            var self = this;
            var $tr = $rowTemplate.clone();
            $tr.find('.column select').html(self.columnOption);
            $tr.find('.operator select').html(operatorTemplate);
            $tr.find('.delete_btn').html(deleteBtnTemplate);

            if(self.$table.find('tr').length == 0){
                $tr.find('.add_btn').html(addBtnTemplate);
            }else{
                $tr.find('.add_btn').html('且');
            }    
            
            $tr.appendTo(self.$table);
            return $tr;
        },
        

        /* 還原 Field */
        revertField: function($tr, column, value) {
            $tr.find('.column select').val(column);
            $tr.find('.field').attr('name',column).val(value);
            
            var $operator = $tr.find('.operator select');
            var $cond = $tr.find('.condition');
            var $input = $cond.find('input');
            
            var operator = value.substr(0,2);
            if(~$.inArray(operator, ['!=','<=','>=','^=','*='])){
                $operator.val(operator);
                $input.val(value.substr(2));
                return; 
            }
            
            var operator = value.substr(0,1);
            if(~$.inArray(operator, ['=','<','>'])){
                $operator.val(operator);
                $input.val(value.substr(1));
                return; 
            }

            var split = value.split('..');
            if(split.length == 2){
                $operator.val('..');
                $input.val(split[0]);
                
                $(inputTemplate).val(split[1]).appendTo($cond);
                $cond.find('input').addClass('two');
                return; 
            }
            
            var split = value.split('|');
            if(split.length > 1){
                if(split[0].charAt(0) == '!'){
                    $operator.val('!in');
                    $input.val(split[0].substr(1));
                }else{
                    $operator.val('in');
                    $input.val(split[0]);
                }
                
                for (var i = 1; i < split.length; i++) {
                    $(inputTemplate).val(split[i]).appendTo($cond);
                }
                $(inputTemplate).appendTo($cond);
                
                $cond.find('input').addClass('more');
                return; 
            }
            
            $input.val(value);
        },    
        
        
        /* 計算 Field */
        computeField: function($tr) {
            var operator = $tr.find('.operator select').val();
            var $input = $tr.find('.condition input');
            
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

        if (typeof columns === 'string') {
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
