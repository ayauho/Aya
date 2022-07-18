class Aya {
	eval=true
	entities = {
		math:['+','-',"/","*",'%','++','--'],
		relational:['=','>=','<=','!','==','!=','>','<','instanceof'],
		logical:['&','|', '!'],			
		assignment:['+=','-=','*=','/=','%='],
		bitwise:['&&','||','^','~~','<<<','>>>','>>>>'],
		words:['typeof'],
		brackets:['(',')','{','}'],
		special:[').','.(','@','~',',,','?',',','>>','<<','<-'],				
	}
	special_operators=['>>','<<','<-','++','--','+=','-=','*=','/=','%=']	
	reserved = ['_','..','::','.','D','C','G','S','A']
	dotContains = ['.','..',').','.(']
	magnetLeft = [':']
	errorTypes = [
		'Chain construction error', //0
		'Expression error', //1
		'Assignment error', //2
		'Object construction error', //3
		'Function construction error' //4
	]
	errors=[			
		'Unappropriate assignment of undefined variable: $1', //0
		'Corresponding right bracket has not found', //1
		'Excessive expression finishing dot', //2
		'Unable to reassign to array type: $1', //3
		'Impossible to assign undefined variable: $1', //4
		'Impossible to assign such key type: $1 ($2)', //5
		'Missed body of function declaration', //6
		'Impossible to use undefined variable in expression: $1', //7,
		'Unappropriate casting to integer type: $1', //8
		'Unable to continue chain: .$1', //9
		'Wrong function call on initially assigned chain: $1', //10
		'Impossible to assign undefined variable as object value: $1', //11
		'Arguments are prohibited for getter', //12
	]
	debug_aya_assoc={
		func_call:'Function call: %c$1', 
		var_assignment_started:'Assignment started: %c$1', 
		array_assignment_started:'Array assignment started: %c$1',
		object_assignment_started:'Object assignment started: %c$1',
		assignment_continued:'Assignment continued: %c$1',
		array_literal:'Array literal: %c$1',
		func_decl:'Function declaration initiated: %c$1',
		anon_func_decl:'Anonimous function declaration initiated: %c$1',
		if:'If conditions passed: %c$1',
		else_if:'Else if conditions passed: %c$1',
		else:'Else conditions passed: %c$1',
		emit:'Variable emitted: %c$1',
		substituting:'Variable subtituted: %c$1',
		class:'Class construction initiated: %c$1',
		class_exemplar:'Class exemplar created: %c$1',
		loop:'Loop inititated%c'
	}
	debug_js_assoc={
		assignment:'Assigned variables:',
		func_call: 'Function [$1] called with arguments:',
		func_call_no_args: 'Function [$1] called',
		if: 'If conditions passed:',
		else_if: 'Else if conditions passed',
		else: 'Else conditions passed',
	}
	assoc = {array:'[]',object:'{}',integer:'0',string:"''",float:'0.0',bool:'false'}
	scope_names = ['func_decl','if','else','object_assignment','loop','class']	
	
	constructor(run_workout=true,injected={}){
		let _ = this
		_.allSigns = []
		_.operators = []	
		for(let a in _.entities){
			for(let b in _.entities[a]){
				if(a!='words')_.allSigns.push(_.entities[a][b])
				if(!['brackets','special','reserved','words'].includes(a))	
					_.operators.push(_.entities[a][b])
			}
		}
		_.injected=injected
		_.helper()
		if(run_workout){
			_.workout()			 
		}
	}

	init(){
		let _=this
		_.turnOffTest=false
		_.debug_aya=false
		_.debug_js=false
		_.version=0
		_.aya_glob_data={}
		_.dev=false
		_.types = {}
		_.o = {}
		_.codes = []
		_.scope_id = 0
		_.records = []
		_.exprs = [[]]
		_.writes = []
		_.assignments = [{}]
		_.func_decls = [{}]
		_.instruction_index = 0
		_.line_index = 0
		_.entity_index = 0
		_.assignment_level = 0
		_.func_decl_level = 0
		_.args_index=1
		_.level = {expr:0,func_call:0,var_assignment:0,array_assignment:0,object_assignment:0,array_literal:0,func_decl:0,chain:0,key_expression:0,if:0,else:0,record:0,loop_data:0,loop_to:0,loop:0,immediate_func_call:0,'class':0}				
		_.actions_stack = []
		_.exprs_stack = []
		_.scope_tabs_stack = []
		_.loop_index = 1
		_.imported={}
		_.emits={}
		_.substitutes={}
		_.skip_aya_errors=0
		_.terminated=false
		_.initiated={log:0,save_log:0,release_logs:0}
		_.window = Object.assign({},window)
		_.window['this'] = _.window
		_.window.is_window_scope = true
		_.simple_node = document.createElement('div')
		_.createScopeTemplate(_.window,null,'object')
		for(let f of ['log','save_log','release_logs']) 
			_.createScopeTemplate(_.window[f]={},_.window,'function')					
	}

	async process(aya_script,parseScope){
		let _=this
		let prod,script,scripts=[],lines,struct,js,skip_load,count,script_name='aya',dev_attr		
		if(aya_script) scripts.push(aya_script)
		else scripts = document.querySelectorAll("script[type=aya]")	
		for(script of scripts){
			_.init()
			if(Object.keys(_.injected)){
				for(let k in _.injected) _[k] = JSON.parse(_.injected[k])
			}			
			_.dev = _.storage('dev')		
			prod=false
			skip_load=false
			if(typeof script!='string'){
				prod=script.getAttribute('prod')
				if(script.hasAttribute('v')) _.version = script.getAttribute('v')
				if(script.hasAttribute('debug-aya')) _.debug_aya=true
				if(script.hasAttribute('debug-js')) _.debug_js=true				
				if(script.hasAttribute('prod')&&!prod&&!_.dev){
					script_name = script.getAttribute('dev')
					js = _.storage('js',script_name,_.version)
					if(js){
						eval(js)
						prod=true
						skip_load=true
					}
				}
				if(!skip_load){
					if(prod && !_.dev){
						script = await _.loadScript(prod)
					}
					else if(script.hasAttribute('dev')){
						script_name = script.getAttribute('dev')
						script = await _.loadScript(script_name)
					}
					else {						
						script_name = script.getAttribute('name')
						script = script.innerHTML
					}
				}
			}
			if(!prod||_.dev||aya_script){
				lines = script.replace(/\r/g,"").split("\n").filter(v=> v!='')
				struct = _.linesToStruct(lines)
				_.aya_glob_data.struct = struct
				if(aya_script&&!_.compile_aya_script) return true
				await parseScope({parentScope:_.window,struct,range:0})
				js = await _.prepareJS()
				if(_.compile_aya_script) return js
				if(!_.terminated){
					_.turnOffTest=true
					if(_.eval) eval(js)
					_.storage(true,'js',script_name,_.version,js)
					count = _.storage('count',script_name,_.version)||0
					count++
					_.storage(true,'count',script_name,_.version,count)
					if(_.dev) console.log(`%cVersion: ${_.version}(${count})`,'color:lightgreen;')
				}				
				_.aya_glob_data.scopes = _.window.__data__.childScopes[0]
			}
						
		}		
	}

	async workout(aya_script,injected={}){
		let _ = this
		let struct, lines, scope, range, rangeStruct, parent_scope, _scope, struct_range, struct_index, aya
		let entity, entity_obj={}, prev_entity_obj={},next_entity, prev_entity, last, index, d, postponed_end=0, line, prev_line, next_line, tab, postpone_finalize_assignment=0
		let dot='.',comma=',', tilda='~',underscore='_',colon=':',q_mark='?', semicolon=';',double_colon='::',backslash='\\',gt2='>>',lt2='<<',double_comma=',,', plus='+',minus='-'
		let left_curly = '{', right_curly='}',exclamation='!', sub='<-'
		let set_get = ['G','S'], anon_func = ['A',tilda]
		let hasCommaInLine = null, hasCommaInLinePrev = null, hasDoubleCommaInLine = null, hasDoubleCommaInLinePrev = null
		let else_if, next_is, colon_count, loop_to, loop_data, for_in_loop, dots_count, middle_dots_count, dots_count_before, hidden, helper
		let last_expr, starting_entity_obj, chain_assignment, substituting, count_expressions=null, no_define, gathering_string
		let lineLastEntity, lineFirstEntity, nextEntityOperator, next_line_first_entity
		if(aya_script) _.aya_script=aya_script
		_.injected=injected
			
//-- Expressions And Actions	

		function start(){		
			_.level.expr ++			
			if(!_.exprs[_.level.expr]) _.exprs[_.level.expr] = []
			//-- start-end expression values grouped by expression level
			_.exprs[_.level.expr][_.exprs[_.level.expr].length] = [_.entity_index]
			_.exprs_stack.push([ null, _.entity_index, _.level.expr, tab, _.instruction_index, _.line_index ])
			entity_obj.start.expr=true
		}

		function end(endNext){
			if(endNext===true){
				postponed_end++
				return
			}			
			if(!_.level.expr) console.error('Trying to finish not existed expression!')			
			last_expr=_.exprs[_.level.expr][_.exprs[_.level.expr].length-1]
			
			starting_entity_obj = _.writes[last_expr[0]]||entity_obj
			last_expr[1] = _.entity_index
			if(_.record().level_expr === _.level.expr && _.record().def=='if_else'){
				manage_if_else()
			}
			if(starting_entity_obj.follow_expr){
				finish_recent_actions('entity_index',last_expr[0])
			}
			
			if(starting_entity_obj.start.loop_to){
				loop_to=false
				if(last_expr[0]==last_expr[1]){
					entity_obj.loop.to = literal()
				}
			}
			if(starting_entity_obj.start.loop_data){
				loop_data=false
			}
			_.level.expr --
			if(count_expressions){
				count_expressions--
				if(!count_expressions) manage_substitute(true)
			}
			_.exprs_stack.pop()
			entity_obj.end.expr=true
			return _.level.expr
		}

		function expression_level() {
			return _.level.expr
		}

		function recent_expr(){
			return _.exprs_stack[_.exprs_stack.length-1]
		}

		function action(name,a,follow_expr=false,input=null){
			if(a===true) {				
				_.level[name]++
				entity_obj.start[name] = _.level[name]
				let d = [ name, _.entity_index, _.level[name], tab, _.instruction_index, _.line_index, scope ]
				if(input) for(let i in input) d[i] = input[i]
				_.actions_stack.push(d)
				if(follow_expr){
					entity_obj.follow_expr=true
				}
				if(_.debug_aya){
					if(name=='array_literal') _.debugAya({name:'array_literal',entity_obj},struct_index)
				}
			}
			else if(a===false) {									
				let ra = recent_action()
				if(!ra[0]) return false				
				name=ra[0]
				let level = _.level[name], writes_index, start_at = entity_obj.start.at, end_at = entity_obj.end.at
				//-- start-end linking based on names & levels
				if(!end_at[name]) end_at[name] = {}
				if(!start_at[name]) start_at[name] = {}	
				//-- is the same name action finished more then once here
				entity_obj.end[name] = level
				
				//-- link start-end of the action

				start_at[name][level] = ra[1]
				//-- if started and ended on the same index
				if(_.entity_index==start_at[name][level]) {					
					end_at[name][level] = _.entity_index
				} else {
					writes_index = start_at[name][level]
					if(!_.writes[writes_index].end.at[name]) _.writes[writes_index].end.at[name]={}
					_.writes[writes_index].end.at[name][level] = _.entity_index
				}
				//-- clear assignment recording at the start of next entity proceeding
				if(name.includes('assignment')){
					postpone_finalize_assignment++
					if(!_.writes[ra[1]].chain && _.writes[ra[1]].entity){						
						_.writes[ra[1]].defined = _.finalizeAssignment(_.writes[ra[1]].scope, _.writes[ra[1]].entity)
					}
					
					if(['object_assignment','array_assignment'].includes(name)){
						if(name=='object_assignment')next_is=null
						manage_emits(_.startIncrementOfMaxValue(entity_obj.start.at[name]),_.entity_index)
					}
				} else if(name=='func_decl'){
					func_decl(false)					
				} else if(name=='immediate_func_call'){
					hidden=false
				}
				if(_.scope_names.includes(name)&&!else_if){
					if(!(name=='object_assignment'&&_.entity_index==ra[1])){
						return_to_parent_scope()
					}
				} else if(name=='func_call'){
					if(_.debug_aya) {
						if(_.writes[ra[1]].defined&&_.writes[ra[1]].defined.__data__.className) name='class_exemplar'
						_.debugAya({name,entity_obj:_.writes[ra[1]]},struct_index)
					}
				}
				_.actions_stack.pop()
				_.level[name]--
			}
			entity_obj.level[name] = _.level[name]
			return _.level[name]
		}

		function action_level(name){
			return _.level[name]
		}
		
		function recent_action(){
			return _.actions_stack[_.actions_stack.length-1]||{}
		}

		function finish_recent_action(){
			action(null,false)
		}

		function func_call_start(false_if_started=false){
			if((recent_action()[0]=='var_assignment' || func_decl()==2 && lineFirstEntity) && lineLastEntity && !dots_count && !entity_obj.start.func_call && !next_line_higher_tab()) return false
			if(entity_obj.start.func_call&&!false_if_started) return true
			let defined = _.entityDefined(scope,entity_obj,true,false,'in_process'), r = false
			if(defined && ( defined.__data__.type=='function'||defined.__data__.funcVar)) r = defined
			if(false_if_started&&entity_obj.start.func_call) {
				if(recent_action()[0]=='func_call') r = false
				else r = true
			}
			return r
		}

		function func_call_end(){
			return entity_obj.end.func_call
		}

		function finish_recent_exprs(tab=false,value=null,postpone=false){				
			let unclosed_left_bracket=0, expr,once=false
			if(postpone){
				postponed_end=0				
				for(let i=_.level.expr-1;i>=0;i--){
					expr = _.exprs_stack[i]
					if(!isNaN(parseInt(tab)) && expr[3]==tab){
						if(!once&&entity==')'){
							unclosed_left_bracket++
							once=true
						}
						if(_.writes[expr[1]].entity==')') unclosed_left_bracket++
						else if(_.writes[expr[1]].entity=='(') unclosed_left_bracket--
						if(unclosed_left_bracket<0) {
							return expr[1]
						}
					} else if(!isNaN(parseInt(tab)) && expr[3]<tab) break
					else if(tab=='instruction_index' && expr[4]<_.instruction_index) return expr[1]
					else if(tab=='entity_index' && expr[1] < value) break								
					else if(tab=='line_index' && expr[5] < _.line_index) break
					end(true);
				}
			}else {
				while(_.level.expr){
					expr = recent_expr()					
					if(!isNaN(parseInt(tab)) && expr[3]==tab){					
						if(!once&&entity==')'){
							unclosed_left_bracket++
							once=true
						}						
						if(_.writes[expr[1]].entity==')') unclosed_left_bracket++
						else if(_.writes[expr[1]].entity=='(') unclosed_left_bracket--
						if(unclosed_left_bracket<0) {
							return expr[1]
						}
					} else if(!isNaN(parseInt(tab)) && expr[3]<tab) break
					else if(tab=='instruction_index' && expr[4]<_.instruction_index) return expr[1]
					else if(tab=='entity_index' && expr[1] < value) break
					else if(tab=='line_index' && expr[5] < _.line_index) break	
					end()				
				}
			}
			return -1
		}

		function finish_recent_actions(tab=false,value=null,no_scope_start=false){
			let break_after, unclosed_left_bracket=0, ra
			while(true){
				ra =  recent_action()
				if(!_.actions_stack.length) break
				if(no_scope_start&&_.scope_names.includes(ra[0])) break
				else if(!isNaN(parseInt(tab)) && ra[3]<tab) break
				else if(tab=='instruction_index' && ra[4]<_.instruction_index) {
					break
				}
				else if(tab=='scope' && _.scope_names.includes(ra[0])) {
					break_after = ra[1]
				}
				else if(tab=='entity_index' && ra[1] < value) break
				else if(tab=='line_index' && ra[5] < _.line_index) break
				else if(tab=='by_name' && ra[0]==value){
					break_after = ra[1]
				}
				else if(tab=='while_not'&&ra[0]!=value) break
				finish_recent_action()
				if(break_after!==undefined){
					return break_after
				}
			}
		}

		function finish_line_actions_exprs(){
			let from_index=_.entity_index
			if(!lineFirstEntity){
				from_index--
				while(from_index){
					if(_.writes[from_index].line_first_entity) break
					from_index--
				}
			} else from_index=_.entity_index
			finish_recent_exprs('entity_index',from_index)
			finish_recent_actions('entity_index',from_index,true)
		}

		function func_call(){
			for(let i=_.actions_stack.length-1; i>=0; i--){
				if(_.actions_stack[i][0]=='func_call') return true
			}
			return false
		}

		function assignment(stage,type,entity=false){
			if(stage===undefined) return _.assignments[_.assignment_level].stage
			if(stage===true) return _.assignments[_.assignment_level]
			if(stage>0){
				if(stage==1) {
					_.assignment_level++
					if(!_.assignments[_.assignment_level])
						_.assignments[_.assignment_level] = {entities:[]}
					action(type+'_assignment',true)
					start()
					if(_.debug_aya&&entity_obj.entity) _.debugAya({name:type+'_assignment_started',entity_obj},struct_index)
				}
				if(stage==2){
					if(_.debug_aya&&!entity_obj.debugged&&entity_obj.defined&&entity_obj.defined.__data__.type!='function') 
						_.debugAya({name:'assignment_continued',entity_obj},struct_index)
				}
				_.assignments[_.assignment_level].stage = stage
				_.assignments[_.assignment_level].scope = scope
				_.assignments[_.assignment_level].expr_level = expression_level()
				if(type) _.assignments[_.assignment_level].type = type
				if(entity) {
					_.assignments[_.assignment_level].entities.push(entity)
				}
			} else				
			if(stage===false) {			
				_.assignments.pop()
				_.assignment_level--
			}
		}		

		function func_decl(stage,type){
			if(stage===undefined) return _.func_decls[_.func_decl_level].stage
			if(stage===true) return _.func_decls[_.func_decl_level]
			if(stage>0){
				if(stage==1) {
					_.func_decl_level++
					if(!_.func_decls[_.func_decl_level])
						_.func_decls[_.func_decl_level] = {}
					action('func_decl',true)
					start()
					_.func_decls[_.func_decl_level].entity_index = _.entity_index
					if(_.debug_aya)_.debugAya({name:(entity_obj.anonimous?'anon_':'')+'func_decl',entity_obj},struct_index)
				}
				_.func_decls[_.func_decl_level].stage = stage
				if(type) _.func_decls[_.func_decl_level].type = type

			} else				
			if(stage===false) {
				_.func_decls.pop()
				_.func_decl_level--
			}
		}

		function func_decl_start(){
			return func_decl() == 1
		}

		function not_assignment_start(){
			return !entity_obj.start.var_assignment&&!entity_obj.start.array_assignment&&!entity_obj.start.object_assignment
		}	

//-- Check Entity
		function special(entity){
			return _.entities.special.includes(entity)
		}
		function operator(where=null){
			if(where===-1) {
				return prev_entity_obj && prev_entity_obj.operator && (prev_entity_obj.line_index==_.line_index||prev_line_lower_tab())
			}
			else if(where===null) {
				return entity_obj.operator
			}
			else {
				if(nextEntityOperator) return true
				else if(nextEntityOperator===false) return false
				else {
					return nextEntityOperator = _.operators.includes(where)
				}
			}
		}

		function left_bracket(entity){
			return entity=='('
		}

		function right_bracket(entity){
			return entity==')'||entity&&entity[0]==')'
		}	
		
		function bracket(entity){
			return right_bracket(entity) || left_bracket(entity)
		}

		function free_to_assign(){
			return !_.entityDefined(scope,entity_obj,'window',false,'in_process') && assignable()
		}

		function assignable(){
			return entity_obj.type.type=='assignable'
		}

		function value(entity_){
			let remove_dots=false
			if(!entity_) entity_=entity
			else remove_dots=true
			let type = _.type(entity_obj,remove_dots)
			return !['entity','unassignable'].includes(type.type)
		}

		function literal(entity_){
			if(!entity_)entity_=entity
			return entity_obj.type.type=='literal'?  entity_obj.type.concrete: null
		}

		function anonimous_function(entity){
			return entity=='A' || entity=='~'
		}

		function chained(){
			return !literal() && entity.includes(dot)
		}

//-- Location And Its Management

		function has_double_comma_in_line(prev=false){
			let p = false
			if(!prev){
				p = line[1].indexOf(double_comma, index)
				if(p==-1) p=false
				hasDoubleCommaInLine = p					
				return hasDoubleCommaInLine===false ? false : (hasDoubleCommaInLine > index)
			} else {
				p = line[1].lastIndexOf(double_comma, index)
				if(p==-1) p=false
				hasDoubleCommaInLinePrev = p					
				return hasDoubleCommaInLinePrev===false ? false : (hasDoubleCommaInLinePrev < index)
			}
		}

		function has_comma_in_line(prev=false){
			let p = false, p2 = false
			has_double_comma_in_line(prev,true)
			if(!prev){
					p = line[1].indexOf(comma, index)
					if(p==-1) p=false
					hasCommaInLine = p					
				return hasCommaInLine===false ? false : (hasCommaInLine > index && (!hasDoubleCommaInLine || hasCommaInLine < hasDoubleCommaInLine))
			} else {
					p = line[1].lastIndexOf(comma, index)
					if(p==-1) p=false
					hasCommaInLinePrev = p					
				return hasCommaInLinePrev===false ? false : (hasCommaInLinePrev < index && (!hasDoubleCommaInLinePrev || hasCommaInLinePrev > hasDoubleCommaInLinePrev))
			}
		}

		function next_entity_is_comma(){
			return next_entity==comma
		}

		function next_entity_is_double_comma(){
			return next_entity==double_comma
		}

		function prev_entity_is_comma(){
			return prev_entity==comma
		}

		function prev_entity_is_double_comma(){
			return prev_entity==double_comma
		}

		function line_first_entity(){
			entity_obj.line_first_entity = !index || entity_obj.scope_start || prev_entity_is_comma() || prev_entity_is_double_comma() || prev_entity==q_mark || prev_entity==semicolon || next_line_first_entity
			if(next_line_first_entity) next_line_first_entity=false
			return entity_obj.line_first_entity
		}			

		function line_last_entity(){
			entity_obj.line_last_entity = rangeStruct[d][1].length-1 == index || next_entity_is_comma() || next_entity_is_double_comma() || next_entity==semicolon || next_entity==q_mark
			return entity_obj.line_last_entity
		}

		function last_symbol(entity){
			return entity[entity.length-1]
		}

		function first_symbol(entity){
			return entity?entity[0]:null
		}		

		function remove_last_symbol(entity){
			return entity.substring(0,entity.length-1)
		}

		function remove_last_symbols(entity,symbol){
			let count=0
			while(true){
				if(last_symbol(entity) != symbol) break
				entity = remove_last_symbol(entity)
				count++
			}
			return [entity,count]
		}

		function check_all_dots(entity,first_entity_underscore){
			entity = check_side_symbols()			
			let m=entity.match(/[\.]+/g)
			let max=0
			if(m){				
				for(let dots of m) if(dots.length>max)max=dots.length
			} else if(first_entity_underscore) max=1
			middle_dots_count = max
		}		

		function remove_first_dots(entity){
			let count=0
			while(true){
				if(first_symbol(entity) != dot) break
				entity = entity.substring(1)
				count++
			}
			return [entity,count]
		}	

		function last_position(element,from){
			for(let i=(from||(_.writes.length-1));i>=0;i--){
				if(i==_.entity_index && (entity_obj.entity==element || entity_obj.start[element])) return i
				else if(i!=_.entity_index && (_.writes[i].entity==element || _.writes[i].start[element])) return i
			}
			return -1
		}

		function linked_bracket_position(from){
			if(!from) from = _.writes.length-1
			let w,skip=0
			for(let i=from;i>=0;i--){
				w=_.writes[i]
				if(w.entity==')')skip++
				if(w.entity=='('){
					if(skip)skip--
					else return i
				}
			}
			_.error(1)
		}

		function left_bracket_is_assignment_start(){			
			let p = linked_bracket_position()
			if(_.writes[p].level.assignment<_.writes[p+1].level.assignment) return true
			return false
		}

		function line_tab(){
			return line[0]
		}
		
		function prev_line_tab(){
			return has_comma_in_line(true) && line_tab() || prev_line&&prev_line[0] || 0
		}

		function next_line_tab(){
			return has_comma_in_line() && line_tab() || next_line[0]
		}			

		function next_line_higher_tab(){
			if(has_comma_in_line()) return false
			if(next_line&&next_line[0]>line[0]) return true
			return false
		}

		function next_line_lower_tab(){
			 if(has_comma_in_line() || (next_entity==q_mark || next_entity==semicolon) && rangeStruct[d][1][index+1]) return false
			 //if(has_double_comma_in_line()) return false
			 if(next_line&&next_line[0] < line[0]) return true
			 return false
		}

		function prev_line_lower_tab(){
			 if(has_comma_in_line(true)) return false
			 if(prev_line&&prev_line[0] < line[0]) return true
			 return false
		}

		function next_line_equal_tab(filter=false){
			if(has_comma_in_line()) {
				if(filter=='no_comma_separated') return false
			}
			if(next_line&&next_line[0]==line[0]) {
				return true
			}
			return false
		}

		function last_line(){
			return !next_line && !has_comma_in_line() && !has_double_comma_in_line()
		}

		function scope_tab(tab){
			if(tab===false) _.scope_tabs_stack.pop()
			else if(tab===undefined) return _.scope_tabs_stack[_.scope_tabs_stack.length-1]
			else _.scope_tabs_stack.push(tab)
		}

		function prev_entity_equal_line_index(line_index=undefined,entity_index=undefined){
			return (_.writes[entity_index===undefined?_.entity_index-1:entity_index].line_index) == (line_index===undefined?_.line_index:line_index)
		}

		function scope_tabbed(){
			for(let i = _.entity_index;i>=0;i--){
				if(_.writes[i].scope_start) return _.writes[i].scope_tabbed
			}
			return true
		}

		function recent_expr_range(add=0){
			return _.exprs[_.level.expr+add]&&_.exprs[_.level.expr+add][_.exprs[_.level.expr+add].length-1]||[]
		}


		function latest_action(action1,action2){
			let a1, a2, s = _.actions_stack
			for(let i=_.actions_stack.length-1;i>=0;i--){
				if(s[i][0]==action1&&!a1) a1=s[i][1]
				if(s[i][0]==action2&&!a2) a2=s[i][1]
				if(a1&&a2) break
			}
			return a1>a2
		}

		function recent_func_decl_scope(){
			for(let i=last_position('func_decl')+1;_.writes[i];i++){
				if(_.writes[i].scope_start){
					return _.writes[i].scope_start
				}
			}
			throw{}
		}

		function next_continue_chain(){
			return next_entity&&first_symbol(next_entity)==dot&&next_entity.substring(1,2)!=dot&&action_level('chain')
		}

		function class_scope(){
			return scope.__data__.type=='class'
		}

		function assignment_1_or_2(){
			return assignment()&&assignment() < 3
		}

		function has_in_line(entity){
			let has=false
			for(let i=index+1; i<line[1].length; i++){
				if(line[1][i]==entity) has=true
			}
			return has
		}

//-- General Management
		
		function set_type_to_assignments(type,level){			
			let n = _.entity_index-1,w=_.writes[n], record = _.record()
			while(true){
				w=_.writes[n]
				if(!w.start.var_assignment||w.end.key_expression) break
				if(w.level.assignment<=level&&w.assignment.stage<3){
					if(_.writes[n].defined) _.writes[n].defined.__data__.type=type
					else {
						if( record && record.entity_indexes.includes(n)) {
							helper = _.records[_.records.length-1].entity_indexes.indexOf(n)
							_.records[_.records.length-1].defines[helper][3] = type
						}
					}
				}
				n--
				if(!_.writes[n]) break
			}
		}
		
		function manage_emits(index,to){
			let entity_scope = _.writes[index].scope[_.writes[index].entity],emit
			if(entity_scope&&(emit=entity_scope.__data__.emit)){
				if(!_.writes[to].emits)_.writes[to].emits=[]
				_.writes[to].emits.push([emit,_.writes[index].entity])
			}
		}

		function release_record_defines(scope,not_for_index=false){
			let record = _.record(), defines = record.defines, entities = record.entities, indexes = record.entity_indexes
			let i=0
			_.record(false)
			if(defines)
				for(let args of defines) {
					if(scope && not_for_index===false || not_for_index!==i) args[0]=scope
					_.writes[indexes[i]].scope = args[0]
					_.writes[indexes[i]].defined = _.defineEntity(...args)
					i++
				}			
		}

		function manage_if_else(){
			if(next_entity!=q_mark){
				create_child_scope(null,'else',last_position(semicolon)+1)
				helper = _.writes[last_position(semicolon)]
				helper.converted='else'
				if(_.debug_aya) _.debugAya({name:'else',entity_obj:helper},helper.struct_index)						
			} else {	
				else_if = true
				_.writes[last_position(semicolon)].converted=''
			}
			release_record_defines(scope)
		}

		function hide_left_expression(){
			range = _.longestRecentExprRange(_.entity_index, 1)
			for(let i=range[0];i<=range[1];i++){
				_.writes[i].hidden = true
				_.writes[i].return = false
			}
		}

		function check_side_symbols(){			
			[entity,dots_count] = remove_last_symbols(entity,dot);
			[entity,colon_count] = remove_last_symbols(entity,colon);
			[entity,dots_count_before] = remove_first_dots(entity);
			return entity
		}

		function check_underscore(checkAllDots=false){
			if(first_symbol(entity)==underscore){
				if(entity!=underscore) {
					if(checkAllDots) check_all_dots(entity,true)
					entity = entity.substring(1)							
					if(!entity) entity='this'
					else entity = 'this.'+entity
				}
				else entity='this'
				entity_obj.has_this = true
			}							
		}

		function converts(){
			switch(entity){
				case comma: entity_obj.converted=";\n";break
				case double_comma: entity_obj.converted='';break
				case underscore: entity_obj.converted='this';break
				case '&': entity_obj.converted='&&';break
				case '|': entity_obj.converted='||';break		
				case '!': entity_obj.converted='!=';break
				case '=': entity_obj.converted='==';break
				case '!=': entity_obj.converted='!==';break
				case '==': entity_obj.converted='===';break
				case 'N': entity_obj.converted='null';break
				case 'F': entity_obj.converted='false';break
				case 'T': entity_obj.converted='true';break
				case 'U': entity_obj.converted='undefined';break
				case 'I': entity_obj.converted='Infinity';break						
				case 'S':
					entity_obj.is_set=true
					entity_obj.converted='set '
					break
				case 'G':
					entity_obj.is_get = true
					entity_obj.converted='get '
					break	
				case 'D': entity_obj.converted='delete ';break				
				case left_curly:
					entity_obj.converted="try{"
					_.skip_aya_errors++
					break
				case right_curly:
					entity_obj.converted="}catch(error){\n"
					entity_obj.catch_error=true
					_.skip_aya_errors--					
					break					
				case '&&': entity_obj.converted='&';break
				case '||': entity_obj.converted='|';break
				case '>>>': entity_obj.converted='>>';break
				case '<<<': entity_obj.converted='<<';break
				case '>>>>': entity_obj.converted='>>>';break
				case '~~': entity_obj.converted='~';break
				case 'instanceof': entity_obj.converted=' instanceof ';break
			}
			if(dots_count_before==3) entity_obj.converted='...'+entity_obj.entity
		}

		function create_child_scope(entity,type=null,entity_index=null){	
			let entity_obj_
			if(entity_index!==null) {
				entity_obj_=_.writes[entity_index]
				entity=entity_obj_.entity
			} else {
				entity_index = _.entity_index
				entity_obj_=entity_obj
			}
			parent_scope = scope
			scope = _.getScope(parent_scope)			
			_.createScopeTemplate(scope,parent_scope,type)			
			scope_tab(tab)
			scope.__data__.tab = tab
			entity_obj_.scope_start = scope
			scope.__data__.tabbed=entity_obj_.scope_tabbed = !prev_entity_equal_line_index(entity_obj_.line_index,entity_index?entity_index-1:entity_index)
			if(['function','object','class'].includes(type)&&entity) {
				_.implementScope(parent_scope,entity,scope)				
			}
			scope.__data__.entity=entity
			_.instruction_index++
			lineFirstEntity = true

		}

		function return_to_parent_scope(){
			scope = scope.__data__.parentScope
			scope_tab(false)			
		}

		function func_call_on_chain(){
			if((lineLastEntity&&dots_count || !lineLastEntity)&&entity_obj.start.maybe_func_call&&!entity_obj.next_entity_operator&&!entity_obj.next_entity_special) {
				action('func_call',true)
				if(!operator(-1)) start()									
			}	
		}

		function manage_substitute(with_expr=false){
			let before, last, after, new_line, substitute = _.substitutes[with_expr? _.writes[substituting].entity : entity], subst=substitute[0]
			;[before, last] = _.lineSubstringByIndex(line[1],_.currentLines[struct_index],(with_expr?_.writes[substituting].index:index)-1)		
			
			if(!with_expr){
				new_line = `${before} ${subst.join(' ')}`
				_.currentLines[struct_index] = new_line + _.currentLines[struct_index].substring((before+last).length)				
				_.currentStruct[struct_index][1].splice(index,1,...subst)
			}else{
				;[, last,after] = _.lineSubstringByIndex(_.currentStruct[struct_index][1],_.currentLines[struct_index],index)				
				let i, ranges=[],n=0,range,start=false,repls=[],repl,sub,m,reg,parts
				for(let l in _.exprs){
					if(_.exprs[l].length)
					for(i=_.exprs[l].length-1;i>=0;i--){
						range = _.exprs[l][i]
						if(range[1]==_.entity_index){
							start=true
						}
						if(start){
							ranges.push(range)
							n++
						}
						if(n==substitute[1]) {
							break
						}
					}
					if(start) break
				}
				ranges.reverse()
				for(range of ranges){
					repl=[]
					for(i=range[0];i<=range[1];i++){
						repl.push(_.writes[i].initial_entity)
					}
					repls.push(repl)
				}
				for(i in repls){
					for(n in subst){
						n=+n
						sub = subst[n]
						i=+i
						repl = repls[i]
						reg=new RegExp(`\\$${i+1}`)
						m = sub.match(reg)
						if(m){
							helper = _.removeLastSymbols(subst[n],'.')
							if(['"',"'",'`'].includes(subst[n][0]) && ['"',"'",'`'].includes( helper[helper.length-1] )){
								subst[n] = subst[n].replace(reg,repl.join(' '))
							}else{
								parts = subst[n].split(reg)
								if(parts[1][0]=='\\'){
									parts[1]=parts[1].substring(1)
								}
								parts.splice(1,0,...repl)
								if(!parts[0]){								
									parts.shift()
									parts[parts.length-2]+=parts[parts.length-1]
									parts.pop()
								}
								subst.splice(n,1,...parts)
							}
							break
						}
					}
				}
				_.currentStruct[struct_index][1].splice(index+1,0,...subst)		

				new_line = `${before} ${subst.join(' ')}`
				_.currentLines[struct_index] = new_line + last + after
				if(_.writes[substituting].line_first_entity) next_line_first_entity=true
				substituting=null 
				no_define=false 
				hidden=false	
			}		
		}		

		function write(terminate){
			let prev = _.writes[_.writes.length-1],title
			
			entity_obj.assignment = Object.assign({},assignment(true))
			entity_obj.func_decl = Object.assign({},func_decl(true))
			entity_obj.level.assignment = _.assignment_level
			entity_obj.level.func_decl = _.func_decl_level
			entity_obj.level.expr = _.level.expr
			entity_obj.line_index = _.line_index	

			_.writes[_.entity_index]=Object.assign({},entity_obj)
			if(terminate) {
				_.showTerminatedInput(index)
				return false
			}
			if(_.test){
				title = `${entity_obj.entity_index} ${entity_obj.entity}`
				for(let i in entity_obj) {
					if(['entity'].includes(i)) save_log(title,'%c'+i+' = ' + entity_obj[i],'font-style:italic;color:yellow;')
					else save_log(title,i+' = ',entity_obj[i])
				}
				release_logs(title)	
			}
		}

		function show_entity_objs(){
			let index=0
			for(let w of _.writes){
				for(let i in w) log(i+' = ',w[i])
			}
		}

		async function parseScope(input){			
			struct = input.struct			
			scope = _.getScope(input.parentScope)
			struct_range = input.range || [0,struct.length]
			rangeStruct = struct.slice(...struct_range)			
			_.createScopeTemplate(scope,input.parentScope)
			_.currentStruct=struct
//-- Parse Lines			
			let recentAction, from_last_position,  linkedBracketPosition, assignment_type, 
				chain, scope_line_first_entity_index, helper2, entity_defined, n, 
				repeat_this, repeat_entity_obj, define_count=0, skip1, this_unassignable
			let show_logs=true 

			scope_tab(scope.__data__.tab = rangeStruct[0][0])			 
			for(d=0; d<rangeStruct.length; d++){
				struct_index = struct_range[0]+d
				line = rangeStruct[d]
				next_line = rangeStruct[d+1]
				prev_line = rangeStruct[d-1]
				tab = line[0]
				hasCommaInLine = null
				hasCommaInLinePrev = null
				for(index=0; index<line[1].length; ){
					entity = line[1][index]					
					if(helper=_.substitutes[entity]){
						if(!helper[1]) manage_substitute()
						else{
							hidden=true 
							count_expressions=helper[1]
							substituting=_.entity_index
							no_define=true
							this_unassignable = true
						}
						entity = line[1][index]
					}
					_.writes[_.entity_index] = entity_obj = repeat_entity_obj || {entity_index:_.entity_index,entity:null,index,struct_index,level:{},start:{at:{}},end:{at:{}}}										
					entity_obj.initial_entity=entity
					entity_obj.tab = tab
					entity_obj.prev_line_tab = prev_line_tab()
					if(!d&&!index) entity_obj.scope_start=scope
					assignment_type=null
					chain=false
					chain_assignment=false
					nextEntityOperator=undefined
					recentAction=null
					skip1=false
					entity_obj.next_is=next_is
					entity_obj.next_entity = next_entity = line[1][index+1]
					if(!next_entity&&next_line) next_entity = next_line[1][0]
					prev_entity = line[1][index-1]
					if(!prev_entity&&prev_line) prev_entity = prev_line[1][prev_line[1].length-1]
					prev_entity_obj = _.writes[_.entity_index-1] || Object.assign({},entity_obj)										
					if(first_symbol(entity)==backslash){
						entity=entity.substring(1)
						entity_obj.has_backslash=true
					}
					if(last_symbol(entity)==backslash){
						entity=entity.substring(0,entity.length-1)
						entity_obj.has_end_backslash=true
					}
					if(first_symbol(entity)==exclamation&&entity.length>1){
						entity=entity.substring(1)
						entity_obj.has_exclamation=true
					}
					if(first_symbol(entity)==underscore){
						check_underscore(true)
					}else {
						check_all_dots(entity)
						check_underscore()						
					}
					
					if(prev_entity_obj.next_starts_key_expression){
						action('key_expression',true)
					}					

					if(entity==sub){
						entity_obj.entity = entity
						entity_obj.scope = scope
						_.substitutes[prev_entity] = [line[1].slice(index+1)]
						helper2=0
						for(let i in _.substitutes[prev_entity][0]){
							helper = _.substitutes[prev_entity][0][i].match(/\$[\d]+/g)
							if(helper) {
								for(let v of helper){
									v=parseInt(v.replace('$',''))
										if(v>helper2)helper2=v
								}
							}
						}
						_.substitutes[prev_entity].push(helper2)				
						finish_recent_exprs()
						prev_entity_obj.hidden=true
						entity_obj.hidden=true
						write()
						_.entity_index++
						if(_.debug_aya) {
							window.saved_logs['debug-aya'].pop()
							_.debugAya({name:'substituting',entity_obj:prev_entity_obj},struct_index)
						}
						_.showStacks()
						break
					}
					entity_obj.next_starts_key_expression = next_entity&&next_entity.length>2&&next_entity.substring(0,2)==dot+dot&&next_entity[2]!=dot
					entity_obj.next_line_lower_tab = next_line_lower_tab()
					entity_obj.next_line_equal_tab_no_comma_separated = next_line_equal_tab('no_comma_separated')					
					entity_obj.next_entity_operator = operator(next_entity)
					entity_obj.next_entity_special = special(next_entity)
					entity_obj.dots_count = dots_count				
					entity_obj.dots_count_before = dots_count_before
					if(colon_count) entity_obj.colon_count = colon_count	
					else if(!entity) entity = dot.repeat(dots_count)
					if(chain_assignment) chain_assignment = false
					if(colon_count==2) {
						if(!entity) entity_obj.anonimous=true
					}
					
					lineFirstEntity = line_first_entity()
					lineLastEntity = line_last_entity()

					if(hidden)entity_obj.hidden=true			
					
					entity_obj.func_decl = func_decl()
					entity_obj.entity = entity

					entity_obj.type=_.type(entity_obj)
					if(this_unassignable) {
						entity_obj.type={type:'unassignable',concrete:null}
						this_unassignable=false
					}
					if(entity_obj.type.type=='unassignable') entity_obj.unassignable = true
					else if(entity_obj.type.concrete=='operator') entity_obj.operator = true

					converts()
					if(next_entity==sub){
						no_define=true
					}

					//-- import
					if(literal()=='string' && prev_entity=='@' || gathering_string){
						entity_obj.hidden = true
						if(!gathering_string){
							if(!operator(next_entity)){							
								prev_entity_obj.import = entity
								prev_entity_obj.hidden = true
								helper = _.cutSides(entity)
								if(!_.imported[helper]){
									if(dots_count==1&&helper.substring(helper.length-4)=='.aya'){
										_.imported[helper]=true
										helper = await _.loadScript(helper)
										aya = new Aya(false,{imported:JSON.stringify(_.imported)})
										aya.workout(helper)
										lines = aya.aya_glob_data.lines
										helper2 = _.aya_glob_data.lines[struct_index].split(`@${entity+dot}`)
										if(!helper2[1]) helper2.pop()
										helper = _.aya_glob_data.struct[d][1].splice(index+1)
										if(next_entity==comma) helper.shift()
										_.aya_glob_data.struct[d][1].pop()
										_.aya_glob_data.struct[d][1].pop()
										if(_.aya_glob_data.struct[d][1][_.aya_glob_data.struct[d][1].length-1]==comma) {
											_.aya_glob_data.struct[d][1].pop()
											if(helper2[0]){
												helper2[0] = helper2[0].trim()
												helper2[0] = helper2[0].substring(0,helper2[0].length-1).trim()																		
											}
											dots_count--
											index--								
											_.entity_index--																	
											_.writes.pop()																		
										}
										if(tab) for(let i in aya.aya_glob_data.struct){
											aya.aya_glob_data.struct[i][0]+=tab
										}
										if(helper[0]) {								
											aya.aya_glob_data.struct=aya.aya_glob_data.struct.concat([[tab,helper,['',[],[]]]])
										}
										_.aya_glob_data.struct.splice(d+1,0,...aya.aya_glob_data.struct)						
										if(next_entity==comma){
											helper2[1]=helper2[1].trim().substring(1).trim()									
										}								
										helper2.splice(1,0,...aya.aya_glob_data.lines)
										if(!helper2[0]) helper2.shift()
										_.aya_glob_data.lines.splice(struct_index,1)
										_.aya_glob_data.lines.splice(struct_index,0,...helper2)
										if(!_.aya_glob_data.struct[d][1][0]) {
											_.aya_glob_data.struct.splice(d,1)
										}
										rangeStruct = _.aya_glob_data.struct								
										dots_count--
										index--							
										_.entity_index--								
										_.writes.pop()
										line = rangeStruct[d]
										next_line = rangeStruct[d+1]
										tab = line[0]
										hasCommaInLine = null
										hasCommaInLinePrev = null												
										continue
									} else if(/^(http(s?)):\/\//i.test(helper) || dots_count==1&&helper.substring(helper.length-3)=='.js'){
										_.imported[helper]=true
										await aya_import(helper)
										for(let i in window) if(!_.window[i]) _.window[i]=window[i]
									}
								}
							} else {
								gathering_string=_.entity_index
								hidden=true
								prev_entity_obj.hidden = true
								entity_obj.hidden = true
							}
						}
						if(gathering_string){
							entity_obj.gathering_string=true							
							if(lineLastEntity){
								helper = gathering_string
								_.writes[gathering_string-1].gathered = true
								_.writes[gathering_string-1].import = ''
								while(helper<=_.entity_index){
									_.writes[gathering_string-1].import += _.writes[helper].entity
									helper++
								}
								gathering_string=false
								hidden=false
								entity_obj.hidden = false
								entity_obj.entity=''
							}
						}						
					}

					if(prev_entity==semicolon && !prev_entity_obj.has_q_mark_in_line && !repeat_this){
						manage_if_else()
					}

					//-- start if scope
					if(prev_entity==q_mark){
						create_child_scope(null,'if')
					}

					//-- loop
					if((middle_dots_count==2&&entity!='..')||repeat_this){				
						if(!repeat_this){
							entity_obj.loop={}
					    	entity_obj.entities = entity.split('..')				    	
							entity = entity_obj.entities[0]
							check_all_dots()
							entity_obj.entity = entity
							entity_obj.type=_.type(entity_obj)
							entity_obj.hidden=true
							repeat_this = true
							entity_obj.is_loop=true
							if(_.debug_aya) _.debugAya({name:'loop',entity_obj},struct_index)
					    }else{					    	
					    	repeat_this=false
					    	entity = entity_obj.entities[1]
					    	check_side_symbols()
					    	entity_obj.entity = entity
					    	entity_obj.type=_.type(entity_obj)
							if(entity_obj.start.loop_from && left_bracket(entity)){
								entity_obj.for_in_loop=true
								for_in_loop = true
							}else{
								loop_to=true
								action('loop_to',true,true)								
							}													
							repeat_entity_obj = null
							delete entity_obj.converted							
							if(entity_obj.start.func_call)
								entity_obj.restore_start_func_call=true
							entity_obj.start.func_call=false
							entity_obj.defined=null												    	 
					    }
					    converts()
					}					

					//-- plus+plus or minus+minus
					if((entity==plus||entity==minus)&&(lineLastEntity||right_bracket(next_entity)||left_bracket(prev_entity))){
						entity_obj.entity = entity = entity==plus ? plus+plus: minus+minus
						if(left_bracket(prev_entity)) start()
						skip1=true
					} else

					//-- start class scope
					if((prev_entity_obj.class_name||prev_entity_obj.extends)&&lineFirstEntity){
						helper = last_position('class')+1
						create_child_scope(_.writes[helper].entity,'class')
						scope.__data__.objectScope=true
						helper = _.defineEntity(scope,'this','object',true)
						helper.__data__.entity=='this'
						create_child_scope('this','object')
						return_to_parent_scope()
					} else

					//-- start loop data or loop scope 
					if(prev_entity_obj.end.loop_to || prev_entity_obj.end.loop_data || entity_obj.for_in_loop){
						if(entity_obj.for_in_loop) loop_to=false
						if(left_bracket(entity)){
							loop_data=true
							action('loop_data',true,true)
							_.record(true)
							_.record('level_expr',_.level.expr+1)
							_.record('def','loop')
							skip1=true							
						} else {
							create_child_scope(null,'loop')
							helper = _.writes[last_position('loop_from')]
							action('loop',true,false,{1:helper.entity_index,3:helper.tab,4:helper.instruction_index,5:helper.line_index})
							release_record_defines(scope/*,helper.for_in_loop?1:0*/) 
							for_in_loop=false
							define_count = 0
						}						
					} else				

					//-- start object
					if(prev_entity_obj.colon_count==2 && !operator() && (prev_line_lower_tab() || prev_entity_equal_line_index()&&entity!=comma)){
						if(prev_entity_obj.anonimous || prev_entity_obj.obj_key_expr){
							helper = null
						}else{
							helper =  prev_entity_obj.entity
							if(_.stringLiteral(helper)) helper=_.cutSides(helper)
						}
						create_child_scope( helper ,'object')
						if(prev_entity_obj.anonimous) scope.__data__.anonimous=true
						else _.writes[_.entity_index-1].defined = scope
						scope.__data__.objectScope=true	
						skip1=true								
					} else

					//-- if
					if(entity==q_mark){
						hide_left_expression()												
						if(else_if){							
							entity_obj.else_if=true												
							helper = finish_recent_actions('by_name','else')+1
							finish_recent_exprs('entity_index',helper,true)
							helper = 'else if'
							else_if=false
							if(_.debug_aya) _.debugAya({name:'else_if',entity_obj:_.writes[last_position(';')]},struct_index)
						} else {
							if(_.debug_aya) _.debugAya({name:'if',entity_obj},struct_index)
							helper='if'
						}
						action('if',true)
						entity_obj.converted=helper
						skip1=true
					} else

					//-- else					
					if(entity==semicolon){
						entity_obj.converted='else'
						action('else',true)												
						if(has_in_line(q_mark)){					
							_.record(true)
							_.record('level_expr',_.level.expr+1)
							_.record('def','if_else')																			
							entity_obj.has_q_mark_in_line=true
						}
						skip1=true
					} else

					if(prev_entity=='C'&&recent_action()[0]=='class' || prev_entity_obj.class_name){
						if(prev_entity_obj.class_name){
							entity_obj.extends=true
							no_define = true
							entity_obj.converted=` extends ${entity}`
							
						}else{
							entity_obj.class_name = true
							entity_obj.defined = _.defineEntity(scope, entity, 'class', true)
							scope[entity].__data__.className=true
							if(_.debug_aya)_.debugAya({name:'class',entity_obj},struct_index)												
						}	
						if(lineLastEntity) entity_obj.converted=(entity_obj.converted||entity)+"{\n"
						skip1=true
					}

					//-- start func scope
					if(func_decl()==1){
						if(entity_obj.has_backslash) entity_obj.start.default=true
						let func_decl_index = func_decl(true).entity_index			
						if((lineFirstEntity || _.writes[ func_decl_index ].level.expr == _.level.expr) 
								&& !entity_obj.start.default && entity != tilda && entity != 'A'){	
							func_decl(2)
							helper = _.writes[func_decl_index].anonimous? null:_.writes[func_decl_index].entity
							helper2=null
							if(_.writes[func_decl_index].class_entity&&!_.writes[func_decl_index-1].static&&!_.writes[func_decl_index-2].static&&helper!='constructor'){
								if(scope.__data__.entity!='this'&& scope['this'])scope = scope['this']
								helper2 = 'this_scope'				
							}
							create_child_scope(helper,'function')
							if(entity=='super'){
								_.defineEntity(scope,entity_obj,'function')
								action('func_call',true)
								start()
							}							
							if(_.writes[_.entity_index-2]&&_.writes[_.entity_index-2].catch_error){
								_.createScopeTemplate(scope.error={},scope,'string')
							}
							if(helper2 == 'this_scope'){
								scope.__data__.parentScope = scope.__data__.parentScope.__data__.parentScope
							}
							if(_.writes[func_decl_index].anonimous) scope.__data__.anonimous=true
							_.writes[ func_decl_index ].scope = scope
							if(_.writes[ func_decl_index ].arrow) scope.__data__.arrow = true
							if(_.writes[func_decl_index-1]&&_.writes[func_decl_index-1].obj=='key'){
								_.implementScope(parent_scope,_.writes[func_decl_index-1].entity,scope)
							}

						}						
					}

					if(loop_data){
						entity_obj.hidden=true						
					}								

					//-- class
					if(entity=='C'){
						if(recent_action()[0]=='class'){
							entity_obj.entity = entity_obj.entity = entity = 'constructor'														
							func_decl(1)							
							entity_obj.class_entity = true
							_.defineEntity(scope, entity_obj, 'function')
							entity_obj.defined.__data__.classEntity=true
						}else{
							start()
							action('class',true)
							entity_obj.converted='class '
							entity_obj.start_class=true
						}
						skip1=true
					} 

					//-- combination or nested arrays, objects & functions
					if(!['...','..','.'].includes(entity)&&middle_dots_count&&middle_dots_count!=2&&!literal()&&(!dots_count_before||entity_obj.start.key_expression)){
						try{
							entity_obj.recent_action = recent_action()
							entity = _.chaining(entity_obj,scope)							
							if(entity_obj.start.var_assignment) {
								entity_obj.chain_assignment = chain_assignment = true								
							}
							else if(assignment_1_or_2()) assignment(3) 
							if(!chain_assignment&&!lineLastEntity&&entity_obj.chain_def || next_entity&&next_entity.substring(0,2)==dot+dot){
								action('chain',true)
								if(!operator(-1)) start()
							}
							if(entity_obj.start.func_call) {
								action('func_call',true)
								if(!operator(-1)) start()
								if(dots_count){
									dots_count--
									if(!dots_count||next_entity&&next_entity[0]==dot&&next_entity[1]!=dot) {
										finish_recent_action()
										if(!operator(next_entity)) end(true)
										if(recent_action()[0]=='chain') {
											finish_recent_action()
											if(!operator(next_entity)) end(true)
										}
									}
								}								
							}
							entity_obj.chain=true
							chain=true
							if(not_assignment_start()){
								func_call_on_chain()
							} else						
							if(lineLastEntity&&prev_entity=='D'){							
								delete entity_obj.defined.__data__.parentScope[entity_obj.defined.__data__.entity]
							}	
						} catch(err) {
							_.errorType(0,_.line_index)
							write(true)																												
							return false
						}
					}


					//-- continue chaining
					if(!['...','..','.'].includes(entity)&&dots_count_before==1 && recent_action()[0]=='chain' && (!lineFirstEntity || prev_line_lower_tab())){
							entity_obj.continue_chain=true
							if(action_level('chain')){
								chain=true		
								entity_obj.recent_action = recent_action()				
								entity = _.chaining(entity_obj,scope,false,true)
								if(entity_obj.start.func_call) {
									action('func_call',true)
									start()
								}							
								if(entity_obj.start.var_assignment) {
									assignment(1,'var')
									chain_assignment = true
									entity_obj.chain_assignment = true
									if(scope_line_first_entity_index&&_.writes[scope_line_first_entity_index].return){
										if(_.line_index==_.writes[scope_line_first_entity_index].line_index)
											_.writes[scope_line_first_entity_index].return=false
									}
								} else if(assignment_1_or_2()) assignment(3) 								
								entity_obj.chain=true
								entity_obj.continue_chain=true
								if(not_assignment_start()){
									func_call_on_chain()
								}																
							} else if(tab!=scope_tab()) _.error(9,entity)
							else if(!lineFirstEntity){
								entity_obj.converted = '.'+entity
							}
					}

					//-- new / static
					if(entity==lt2){
						if(scope.__data__.type=='class') {
							entity_obj.converted='static '
							entity_obj.static = true
						} else entity_obj.converted='new '
						if(prev_entity=='@') prev_entity_obj.converted='await '						
						skip1=true
					} else					

					//-- prev is new
					if(prev_entity_obj.entity==lt2&&!prev_entity_obj.static&&!func_call_start()){
						action('func_call',true)
						if(!operator(-1)) start()
						skip1=true
					}

					//-- array literal
					if(entity=='..'&&(!lineLastEntity||next_line_higher_tab()||recent_action()[0]=='func_call')){
						action('array_literal',true)
						entity_obj.anonimous=true
						start()
						entity_obj.converted = '['
						skip1=true
					}

					//-- work with brackets
					if(bracket(entity)){
						if(left_bracket(entity)&&!operator(-1)){
							start()
							if((prev_entity_obj.end.func_decl||prev_entity==double_comma&&_.writes[_.entity_index-2].end.func_decl)&&!entity_obj.start.loop_from){
								action('immediate_func_call',true)
								entity_obj.hidden=true
								hidden=true
								helper = prev_entity_obj.end.func_decl? 
									prev_entity_obj.start.at.func_decl[prev_entity_obj.end.func_decl] : _.writes[_.entity_index-2].start.at.func_decl[_.writes[_.entity_index-2].end.func_decl]
								if(_.writes[helper-1].start.var_assignment)helper--
								_.writes[helper].start.immediate_call=true
								if(_.writes[helper-1].entity=='@') _.writes[helper-1].converted=''
								_.writes[helper].end.at.immediate_call = {1:_.entity_index- (prev_entity_obj.end.func_decl?1:2) }
								
								_.writes[_.entity_index- (prev_entity_obj.end.func_decl?1:2)].end.immediate_call=true
								_.writes[_.entity_index- (prev_entity_obj.end.func_decl?1:2)].start.at.immediate_call = {1:helper}
							
							}
						}
						if(right_bracket(entity)&&!entity_obj.next_entity_operator){
							end(true)								
						}
						skip1=true
					}					

					if(!entity_obj.scope) entity_obj.scope = scope
					if(assignable()) {
						_.entityDefined(scope,entity_obj)						
					}
					recentAction=recent_action()
					if(recent_action()[0]=='key_expression'&&colon_count==1){
						chain_assignment=true						
						finish_recent_action()				
					}				
					//-- func declaration or variable assignment

					if(!skip1 
						&& ((colon_count==2&&!entity || assignable() || recent_action()[0]=='object_assignment' || chain_assignment || anon_func.includes(entity)) 
						&& !loop_data && !loop_to && middle_dots_count!=2 
						&& (lineFirstEntity || free_to_assign() || chain_assignment || left_bracket(prev_entity) || prev_entity==lt2 || prev_entity==semicolon || anon_func.includes(entity) || set_get.includes(prev_entity) && func_decl()!=1) 
						&& (!lineLastEntity || next_line_higher_tab())
						&& recent_action()[0]!='func_call' 
						&& !next_continue_chain() && !entity_obj.next_entity_operator && (!operator(-1)||recentAction[0]=='key_expression')
						&& !entity_obj.next_starts_key_expression) 
						|| colon_count==2 ){
						//-- func declaration
						recentAction = recent_action()[0]	
						if(anon_func.includes(entity) 
							|| (!chain && !dots_count && free_to_assign() && next_line_higher_tab() || next_entity==tilda || set_get.includes(prev_entity)) 
								&& (assignable(entity)) 
								&& !anonimous_function(next_entity) 
								&& !colon_count 
								&& (lineLastEntity&&next_entity!=q_mark || first_symbol(next_entity)==backslash || set_get.includes(prev_entity))){							
							if(recent_action()[0]=='class') entity_obj.class_entity=true							
							if(anon_func.includes(entity)) {
								entity_obj.anonimous = true
								entity_obj.converted = ''
							}						
							func_decl(1)
							if(prev_entity=='@') {
								prev_entity_obj.converted='async '
							}					
							if(next_entity==tilda || entity==tilda) {
								entity_obj.arrow = true								
							}
							if(set_get.includes(prev_entity)){
								entity_obj.set_get=true
							}
							if(!entity_obj.anonimous){
								helper = false
								entity_obj.scope = scope
								if(recentAction=='class'){
									if(!prev_entity_obj.static||prev_entity_obj.is_get&&!_.writes[_.entity_index-2].static){
										if(scope['this']&&scope.__data__.entity!='this'){
											helper=true
											scope = entity_obj.scope = scope['this']
										}
									} else{
										if(scope.__data__.entity=='this'){
											scope = entity_obj.scope = scope.__data__.parentScope
										}
									}
									if(scope.__data__.entity=='this') helper=true
								}			
								_.defineEntity(entity_obj.scope, entity_obj, 'function', helper)							
								if(helper) entity_obj.defined.__data__.classEntity=true
							}							
							if(assignment_1_or_2()) assignment(3)
						}
						//-- start assignment
						if(!entity_obj.continue_chain &&  !entity_obj.is_loop && !_.inAssignmentProcess(scope, entity) && (!anon_func.includes(entity) && colon_count==2 && !entity || recent_action()[0]!='immediate_func_call'&&recent_action()[0]!='object_assignment' && (!chain||chain_assignment) && (assignable()||chain_assignment) && !func_call_start() && !func_decl_start() && value(next_entity) && (!lineLastEntity || dots_count==2) && !no_define || colon_count==2)){
							if(dots_count==2) {								
								assignment_type='array'
								if(helper = entity_obj.defined) {
									if(helper.__data__.type=='array') entity_obj.push=true
								}
								
							}
							else if(colon_count==2){
								assignment_type='object'	
							}
							else assignment_type='var'
							if(!chain_assignment&&free_to_assign()&&next_entity!=sub){								
								helper = false
								entity_obj.scope = scope
								if(recentAction=='class'){
									if(!prev_entity_obj.static||prev_entity_obj.is_get&&!_.writes[_.entity_index-2].static){
										if(scope['this']&&scope.__data__.entity!='this'){											
											scope = entity_obj.scope = scope['this']
										}
									} else{
										if(scope.__data__.entity=='this'){
											scope = entity_obj.scope = scope.__data__.parentScope
										}
									}
									if(scope.__data__.entity=='this') helper=true
								}
								assignment(1,assignment_type,entity)
								_.defineEntity(entity_obj.scope || scope, entity_obj, assignment_type=='var'?null:assignment_type, helper, false, true)
								if(anonimous_function(next_entity)) entity_obj.defined.__data__.funcVar = true
								if(helper) entity_obj.defined.__data__.classEntity=true
							} else {
								assignment(1,assignment_type)
								if(colon_count==2&&!entity&&next_is=='value') {
									if(prev_entity_obj.obj=='key'){							
										prev_entity_obj.defined.__data__.type='object'
									}								
									finish_recent_action()
								}
							}
							if(func_decl()==2 && scope_line_first_entity_index&&_.writes[scope_line_first_entity_index].return){
								if(_.line_index==_.writes[scope_line_first_entity_index].line_index)
									_.writes[scope_line_first_entity_index].return=false
							}
						}
					}					

					//-- change assignment stage
					if(assignment()){
						if(assignment() == 1 && value() && !assignment(true).entities.includes(entity) ){
							assignment(2) // prevent further ability to assign undefined
						}
						if(assignment() == 2){
							//-- prevent further ability to continue assignment chain
							if(right_bracket(entity) || entity_obj.next_entity_operator || func_call_start() || (value()&&!chain_assignment&&!_.entityDefined(scope,entity)) || (assignment(true).type=='object'&&!entity_obj.start.object_assignment) || assignment(true).type=='array'){
								assignment(3)
							}						
							//-- cann't assign undefined to defined var
							try{
								if(assignment() == 2&&free_to_assign()&&func_decl()!=2&&!chain_assignment) {
									_.error(0,entity)
									assignment(3)
								}
							} catch(err) {
								_.errorType(2,_.line_index)
								write(true)																													
								return false								
							}

						}
						if(entity=='..'&&(lineLastEntity||next_is=='value')&&!next_line_higher_tab() && (!lineFirstEntity || latest_action('func_decl','loop'))) {
							if(assignment() == 2) assignment(3)
							//-- entity_obj.converted='[]'
							set_type_to_assignments('array',_.assignment_level)
							if(recent_action()[0]!='array_literal') {
								entity_obj.converted='['
								action('array_literal',true)
								if(next_is=='value' && prev_entity_obj.obj=='key'){									
									prev_entity_obj.defined.__data__.type='array'
								}
							}
							finish_recent_action()
							//-- entity_obj.semicolon=true
						}							
						if(assignment()!=3 && (['@',lt2,gt2].includes(entity) || entity_obj.next_entity_operator) ){
							if(entity==gt2&&_.debug_aya) {
								window.saved_logs['debug-aya'].pop()
								_.debugAya({name:'emit',entity_obj:prev_entity_obj},struct_index)
							}
							assignment(3)
						}
						if(colon_count==2&&!entity) {
							assignment(3)
							if(lineLastEntity&&!next_line_higher_tab()){
								entity_obj.converted=''
								set_type_to_assignments('object',_.assignment_level-1)
							}
						}											
					}
				
					//-- func call not started yet but needs to start
					helper = func_call_start(true)
					if(!entity_obj.start.var_assignment && !chain_assignment && !entity_obj.start.func_decl && func_call_start(true) && !_.entities.words.includes(prev_entity) && assignable() && helper && (helper.__data__.type=='function' || helper.__data__.funcVar) && (dots_count || !func_call() || !lineLastEntity) && prev_entity!='instanceof' || entity_obj.type.concrete=='function'){
						action('func_call',true)
						if(dots_count)dots_count--
						if(!operator(-1)) {
							start()
						}
						if(loop_to&&left_bracket(next_entity)){
							finish_recent_action()
							end(true)
						}
					}

					//-- return statement
					if(!entity_obj.start.immediate_func_call && !entity_obj.default && lineFirstEntity&&(not_assignment_start()||entity_obj.anonimous)&&func_decl()==2 && (!func_call_start() || dots_count==1 || lineLastEntity&&dots_count) && scope_tab()==tab && !next_line_higher_tab() && !entity_obj.unassignable && !entity_obj.is_loop) {
						if((recent_action()[0]!='object_assignment'||entity_obj.anonimous) && (!entity_obj.next_entity_special || lineLastEntity) && !['@'].includes(entity) && entity_obj.type.concrete!='special' && entity_obj.type.type!='entity' && !entity_obj.next_starts_key_expression){ 
							entity_obj.return=true							
						}
						if(dots_count) dots_count--
					}

					if(entity_obj.operator && _.writes[scope_line_first_entity_index] && _.writes[scope_line_first_entity_index].return && _.special_operators.includes(entity_obj.converted || entity)){
						_.writes[scope_line_first_entity_index].return = false
					}

					//-- force return					
					if(func_decl()==2){
						if(tab==scope_tab()&&lineFirstEntity) scope_line_first_entity_index = _.entity_index
						if((lineLastEntity&&(!func_call_start()&&dots_count==1|| func_call_start()&&dots_count==2 )) &&( !entity_obj.unassignable||entity_obj.anonimous)){
							if(scope_line_first_entity_index == _.entity_index) entity_obj.return = true
							else _.writes[scope_line_first_entity_index].return = true
						}
					}

					//-- finish actions by dots
					if(entity&&!repeat_this&&(assignment_type!='array'||assignment()<3)&&dots_count && (assignment() > 2 || !assignment()) && !['...','..','.'].includes(entity)&&!right_bracket(next_entity)){						
						for(let i=0; dots_count>0;){
							if(!recent_action()[0]) break
							finish_recent_action()													
							if(!(!i && func_call_start() && entity_obj.next_entity_operator)) {
								if(!_.level.expr) _.error(2)
								else end(true)
							}
							dots_count--
							if(_.line_index!=recent_action()[5]) break
							i++				
						}
					}

					//-- next entity continues chain (finish func call)
					if(next_continue_chain()&&recent_action()[0]=='func_call'&&!dots_count){
						helper = finish_recent_actions('by_name','func_call')
						if(!_.writes[helper-1].operator) end(true)
					}

					//-- finish all actions started after nearest left bracket
					if(right_bracket(next_entity)){
						try{
							from_last_position = 0
							linkedBracketPosition = linked_bracket_position()
							while(true){
								recentAction = recent_action()
								if(!recentAction) break							
								from_last_position = last_position(recentAction[0],from_last_position)
								if(linkedBracketPosition < from_last_position){
									if(recentAction[0]=='immediate_func_call'){
										hidden=false
									}
									finish_recent_action()
									end(true)						
								} else break
								from_last_position--
							}
							if(operator()) end(true)
						} catch(err) {
							_.errorType(1,_.line_index)
							write(true)																													
							return false							
						}
					}
					//-- func call finished if next is operator
					if(entity_obj.next_entity_operator && func_call_start() && !func_call_end()){
						finish_recent_action()
					} else

					//-- force let in the scope
					if(!func_call_start() && (free_to_assign()&&(assignment()==1||func_decl()==2||loop_data) || assignable() && dots_count_before==1) && !chain_assignment && next_is!='key' && !chained() && (!_.inAssignmentProcess(entity_obj.defined || scope,entity)||colon_count==2)){
						if(for_in_loop&&loop_data){
							define_count++
							if(define_count==3) no_define=true
						}
						if(!no_define) {
							if(assignment()==1 && free_to_assign() && func_decl()!=2 && scope.__data__.type!='class'){								
								_.error(7,entity)
								assignment(3)
							} else {
								_.defineEntity(scope, entity_obj, null, chain || loop_data, dots_count_before!=1&&func_decl()==2)
							}
						}
						if(prev_entity_obj.start.loop_data) entity_obj.loop_iterator=true
					}

					//-- standard expression
					if(assignable() || literal() || chained() || entity=='this' || _.entities.words.includes(entity)){												
						if(!func_call_start()){
							try{
								if(!operator(-1)||entity_obj.start.loop_to || lineFirstEntity&&!prev_line_lower_tab() ){
									if(!no_define&&free_to_assign()&&!func_decl()&&!entity_obj.start.var_assignment&& assignment()!=1 &&next_is!='key'&&!chained()&&!loop_data&&!class_scope()) {
										if(entity_obj.next_starts_key_expression){
											_.defineEntity(scope,entity_obj,'object')
											action('chain',true)
											if(!operator(-1)) start()											
										} else _.error(7,entity)
									}
									start()
								}
								if(!entity_obj.next_entity_operator && !_.entities.words.includes(entity)){
									end(true)
								}
							} catch(err) {
								_.errorType(1,_.line_index)
								write(true)																
								return false								
							}
						}
					}					

					//-- make gap in chain to put expression					
					if(entity_obj.next_starts_key_expression){
						if(recent_action()[0]=='func_call'){
							finish_recent_action()
							postponed_end=0
							finish_recent_exprs('entity_index',recent_action()[1])
						}
					}

					//-- object key-value pairs
					helper = latest_action('func_decl','object_assignment')
					if(helper){
						next_is=null
					} else if(assignment(true).type=='object'&&(colon_count!=2||next_is=='key')&&entity){
						try{
							if(assignment()<3) assignment(3)
							if(set_get.includes(entity)){
								entity_obj.obj='set_get'
							} else if(next_is=='value') {
								entity_obj.obj='value'
								if(prev_entity_obj.obj!='value'){
									entity_obj.start.obj_value = true
									prev_entity_obj.end.obj_key = true
								}
								if(lineLastEntity) entity_obj.end.obj_value=true
								if(!func_call_start()&&recent_action()[0]=='chain') {
									finish_recent_action()									
								}
							} else if(next_is=='key') {
								entity_obj.obj='key'
								if(prev_entity_obj.obj!='key'||entity_obj.scope_start){
									entity_obj.start.obj_key = true
									if(prev_entity_obj.obj=='value') prev_entity_obj.end.obj_value=true
								}

								if(entity_obj.start.obj_key&&(!literal() || operator(next_entity))){
									if(!func_call_start() && !entity_obj.next_entity_operator){
										if(!colon_count) {
											entity_obj.obj='key_value'
											entity_obj.start.obj_key=true
											entity_obj.start.obj_value=true
											entity_obj.end.obj_value=true
											entity_obj.end.obj_key=true
										}
									} else {
										entity_obj.obj_key_expr=true
									}
								} else if(colon_count==2){
									entity_obj.end.obj_key=true
								}

								entity_defined = _.entityDefined(scope,entity_obj,true)								
								if(!entity_defined&&!latest_action('func_decl','object_assignment') && entity_obj.obj=='key_value' && !entity_obj.start.func_call && !entity_obj.obj_key_expr){
									helper = recent_func_decl_scope()	
									entity_defined = _.defineEntity(helper,entity_obj, null, func_decl()==2?false:true, true)									
									if(anon_func.includes(next_entity)) entity_defined.__data__.type='function'									
									else entity_defined.__data__.objectScope=true
									helper = 'recently_defined'
								}
								if((entity_defined || prev_entity_obj.obj_key_expr || (entity_obj.obj=='key_value'&&helper!='recently_defined'))&& entity_obj.obj!='key_value'){
									entity_obj.obj_key_expr=true
								}

								if(colon_count==2) entity_obj.end.obj_key=true						
								if(entity_defined) entity_obj.defined = entity_defined
								else if(!entity_defined&&entity_obj.start.obj_key&&!entity_obj.next_entity_operator&&!colon_count) _.error(11,entity)
								if(colon_count==1){
									next_is='value'
									entity_obj.end.obj_key=true
									helper = entity_obj.start.obj_key? _.entity_index : last_position('obj_key')								
									finish_recent_exprs('entity_index',helper,true)
									finish_recent_actions('entity_index',helper)
								}
								helper = _.stringLiteral(entity)? _.cutSides(entity):entity
								if(!entity_defined&&!entity_defined&&(entity_obj.obj=='key_value' || colon_count==1) && entity_obj.start.obj_key && !entity_obj.start.func_call && !entity_obj.obj_key_expr){
									entity_obj.defined = _.defineEntity(scope,helper,null,true,true)
									if(anon_func.includes(next_entity)) entity_obj.defined.__data__.type='function'
									else scope[helper].__data__.objectScope=true																							
								}							
								if(prev_entity_obj.obj_key_expr && !colon_count){
									entity_obj.obj_key_expr=true
								}
							}
							
							if(entity_obj.start.obj_value&&entity_obj.end.obj_value){
								if(!entity_obj.defined)	_.entityDefined(scope,entity_obj,true)
								if(entity_obj.defined||chain){	
									if(entity_obj.start.obj_key&&entity_obj.end.obj_key) _.implementScope(scope,entity,entity_obj.defined)
									else if(!prev_entity_obj.start.func_call&&!prev_entity_obj.obj_key_expr) {
										[helper,] = remove_last_symbols(prev_entity,colon)
										if(_.stringLiteral(helper)) helper = _.cutSides(helper)
										_.implementScope(scope,helper,chain?entity_obj.defined:entity_obj.defined)
									}
								}
							}

							if(prev_entity_obj.level.assignment>_.assignment_level){
							}
						}catch(err){
							_.errorType(3,_.line_index)
							write(true)																												
							return false							
						}
					}

					if(recent_action()[0]=='object_assignment'&&assignment()==3&&prev_entity_obj&&prev_entity_obj.end.func_decl){
						entity_obj.converted=','+entity
						entity_obj.preceding_comma=true
					}


					//-- prepare else
					if(next_entity == semicolon) {
						helper = finish_recent_actions('by_name','if')+1
						finish_recent_exprs('entity_index',helper,true)
						scope = _.writes[helper].scope_start.__data__.parentScope
					}
					
					//-- finalize actions and expressions
					if(lineLastEntity){
						if(lineFirstEntity){
							if(entity==dot) entity_obj.converted='break'
							else if(entity==dot+dot) entity_obj.converted='continue'
						}
						helper=false
						if(last_line()&&next_entity===undefined){
							finish_recent_exprs()
							finish_recent_actions()
							postponed_end = 0
							entity_obj.last=true
						} else if(next_entity == double_comma){
							helper2 = tab
							helper = finish_recent_actions('scope') || 0
							finish_recent_exprs('entity_index',helper,true)
							helper2 = tab-scope_tab()
							_.aya_glob_data.struct[lineLastEntity?d+1:d][0]-=helper2
						} else if(tab==scope_tab() && has_comma_in_line() || (helper=entity_obj.next_line_equal_tab_no_comma_separated && scope_tabbed())) {
							postponed_end=0
							helper2 = helper?'line_index':'instruction_index'
							finish_recent_exprs(helper2,null)
							finish_recent_actions(helper2)														
							if(tab == scope_tab() && recent_action()[0]!='object_assignment') entity_obj.semicolon=true;										
						} else if(entity_obj.next_line_lower_tab || entity_obj.next_line_equal_tab_no_comma_separated) {	
							postponed_end=0
							helper = finish_recent_exprs(next_line_tab(),null)
							if(helper>-1) finish_recent_actions('entity_index', helper)
							else finish_recent_actions(next_line_tab())
							if(entity_obj.next_line_lower_tab&&scope_tab()==next_line[0] || next_line_equal_tab() && tab==scope_tab()) entity_obj.semicolon=true;										
						}
					}

					//-- finishing func argument expression
					if(func_decl()==1 && !entity_obj.start.func_decl && (lineLastEntity || first_symbol(next_entity)==backslash)){						
						helper = last_position('default',_.entity_index)
						finish_recent_exprs('entity_index',helper,true)
						finish_recent_actions('entity_index',helper)						
					}

					//-- finish object value by expression
					if(entity_obj.obj=='value'){
						range = recent_expr_range(1)
						if(range[1]&&_.writes[range[0]].start.obj_value && range[1]==_.entity_index){
							entity_obj.end.obj_value = true
							next_is='key'
						}
					}


					//-- loop from expression
					if(repeat_this){
						postponed_end=0
						finish_line_actions_exprs()
						range = _.longestRecentExprRange(_.entity_index)
						helper = _.entity_index==range[0] ? entity_obj:_.writes[range[0]]
						for(let i=range[0];i<range[1];i++){
							(!i? helper: _.writes[i]).hidden=true
						}
						entity_obj.end.loop_from=true
						helper.start.loop_from=true
						helper.end.at.loop_from = {1:_.entity_index}
						entity_obj.start.at.loop_from ={1:range[0]}
						repeat_entity_obj = entity_obj
						if(range[0]==range[1]){
							entity_obj.loop.from = literal()
						}
						entity_obj.variants=[{}]
						for(let i in entity_obj){
							entity_obj.variants[0][i] = typeof entity_obj[i]=='object'? Object.assign({},entity_obj[i]):entity_obj[i]
						}
						continue
					}

					//-- loop to expression
					if(loop_to || entity_obj.for_in_loop) {
						entity_obj.hidden=true
						if(middle_dots_count==2)entity_obj.variants.push(entity_obj)
					}

					//-- end expressions before if
					if(next_entity==q_mark){
						postponed_end = 0
						finish_line_actions_exprs()	
						entity_obj.hide_else_close=true					
					}

					//-- manage variants func call collision
					if(entity_obj.restore_start_func_call) {
						entity_obj.variants[0].start.func_call=true
					}				
					
					if((!entity_obj.defined&&entity_obj.unassignable&&entity&&!entity_obj.converted || _.entities.words.includes(entity)) && entity_obj.type.concrete!='reserved') {						
						entity_obj.converted = ` ${entity} `
					}

					if(entity_obj.has_exclamation){
						entity_obj.converted = entity_obj.converted? exclamation+entity_obj.converted : exclamation+entity
					}
					
					if(postponed_end){
						try{
							for(;postponed_end>0;postponed_end--) end()
						} catch(err) {
							_.errorType(1,_.line_index)
							write(true)													
							return false
						}
					}
				
					if(recent_action()[0]=='object_assignment'){ 
						//-- continue obj
						if(!next_is||next_is=='set_get'){							
							next_is='key'
						}
						//-- finish obj
						if(next_entity==comma) {
							finish_recent_actions('while_not','object_assignment')
							helper = _.level.expr
							finish_recent_exprs('entity_index',recent_action()&&(recent_action()[1]+1)||0,true)
							next_is=null
						}
						//-- end value by expression end
						if(next_is=='value'&&colon_count!=1){
							helper = last_position('obj_value')
							range = _.longestRecentExprRange(_.entity_index)
							if(range && (helper>-1 && range[0]==helper || helper==_.entity_index)){
								next_is='key'
							}
						}
					}

					//-- await
					if(entity_obj.start.func_call && prev_entity=='@'){
						prev_entity_obj.converted='await '	
					}
					
					//-- finalize key_expression
					recentAction = recent_action()
					if(recentAction[0]=='key_expression'&&(_.entity_index>recentAction[1]+1 || next_entity&&next_entity[0]==dot&&next_entity[1]!=dot || chain_assignment )&&!operator()&&!entity_obj.next_entity_operator){
						console.log( entity_obj )
						finish_recent_action()
					}

					if(next_entity&&next_entity[0]==dot&&next_entity[1]!=dot && !action_level('chain') && func_decl()!=1 && (!lineLastEntity||next_line_higher_tab())){
						if(recentAction[0]=='func_call'){
							finish_recent_action()
							end(true)
						}
						action('chain',true)
						if(!operator(-1)) start()
					}

					//-- finalize chain
					if(recent_action()[0]=='chain'&&operator(next_entity)){
						finish_recent_action()				
					}				

					if(no_define&&!substituting)no_define=false
					entity_obj.recent_action = recent_action()[0]

					write()

					while(postpone_finalize_assignment){						
						assignment(false)						
						postpone_finalize_assignment--
						if(!postpone_finalize_assignment&&recent_action()[0]=='object_assignment') next_is='key'
					}

					//-- function/object assignment to variable(s)
					for(let w of ['array_literal','func_decl','object_assignment','var_assignment']){						
						if(entity_obj.end[w]){
							for(let l in entity_obj.start.at[w]){
								
								if(entity_obj.end.var_assignment){							
									helper= entity_obj.start.at[w][l]
									n=w!='var_assignment' ? entity_obj.start.at[w][l] : _.entity_index
									if(w!='var_assignment'&&(helper>n)) continue
									let _scope = null,is_new,is_import,is_emit,emit,is_anonimous,check_scope_start							
									if(w=='var_assignment'){
										if(entity_obj.chain) _scope = entity_obj.defined
										else if(!entity_obj.end.func_call) _scope = _.entityDefined(entity_obj.scope,entity_obj.entity,'function')
										if(entity_obj.end.func_decl){
											check_scope_start=true
										}							
										n=helper
										while(n<=_.entity_index){																		
											if(_.writes[n].assignment.stage==3 || _.writes[n].assignment.stage==2 && _.writes[n].end.var_assignment==_.writes[helper].level.var_assignment) {
												if(_.writes[n].entity==lt2){
													is_new = true
													_scope = _.entityDefined(entity_obj.scope,_.writes[n+1].entity,'function')
													break
												}											
												if(_.writes[n].entity=='@'&&!_.writes[n+1].start.func_decl&&!_.writes[n+1].start.func_call){
													is_import = true
													break
												}
												if(_.writes[n].entity==gt2){
													is_emit = true
													_.writes[n].hidden=true
													_.writes[_.entity_index].hidden=true
													_.writes[_.entity_index].emitter=true
													break
												}																					
											}
											n++
											if(check_scope_start && _.writes[n] && (_scope=_.writes[n].scope_start)){
												break
											}	
										}
										if(is_new&&_scope){
											if(_scope.this){
												_scope = Object.assign({},_scope)
												let where = [_scope['constructor'].this,_scope.this]
												for(let i2=0;i2<2;i2++){
													if(!i2&&!_scope['constructor']&&!_scope['constructor'].this) continue
													for(let i in where[i2]) {
														if(i!='__data__'&&where[i2][i])
															_scope[i]=where[i2][i]
													}
													if(i2) {
														delete _scope.this
														delete _scope['constructor']
													}
													else delete _scope['constructor'].this																																
												}

											}
											if(_scope) _scope.__data__.type='object'
										}
										if(is_import||is_new&&!_scope){
											_.createScopeTemplate(_scope = {}, scope, 'object')
											_scope.__data__.type='object'
											_scope.__data__.import=true
										}							
									}else{
										if(!['array_literal'].includes(w)) {											
											n++		
											while(true){
												if(n>=_.entity_index) {
													if(n>_.entity_index&&_.writes[n-1].anonimous) is_anonimous=true
													break
												}	
												if(_.writes[n].anonimous) is_anonimous=true												
												if(_scope=_.writes[n].scope_start) break																					
												n++	
											}
										}
									}
									n=helper
									if(w=='func_decl'|| ['object_assignment','array_assignment'].includes(w) && _.writes[n].anonimous) n--									
									while(_.writes[n] && _.writes[n].assignment.stage<3 && n<=_.entity_index){									
										if( _.writes[n].continue_chain || _.writes[n].end.key_expression ) break
										if(is_emit){
											_.writes[n].hidden = true
											_.writes[n].defined.__data__.emit = _.writes[_.entity_index].converted||_.writes[_.entity_index].entity
											_.emits[_.writes[_.entity_index].entity] = true
											n++
											continue
										}else{
											if(_scope&&!_.writes[n].assigned){
												if(_.writes[n].chain&&_.writes[n].defined) {
													for(let e in _scope) if(e!='__data__') _.writes[n].defined[e] = _scope[e]
													_.writes[n].assigned=true
													break
												}
												else if(!_.writes[n].unassignable) {
													_.implementScope(_.writes[n].scope,_.writes[n].entity,_scope)
													_.writes[n].defined = _scope
													_.writes[n].assigned=true
													break
												}
											}
											if(_.writes[n].defined && (emit=_.writes[n].defined.__data__.emit) && w!='array_literal' && !is_anonimous){
												if(!_.writes[_.entity_index].emits)_.writes[_.entity_index].emits=[]
												_.writes[_.entity_index].emits.push([emit,_.writes[n].converted||_.writes[n].entity])
											}
										}
										n--
									}
								}
							}

						}
					}
					_.writes[_.entity_index].instruction_index = _.instruction_index
					
					if(colon_count == 2 && !entity_obj.anonimous) {
						next_is='key'
					}
					if(_.stop_at&&_.entity_index==_.stop_at) throw{}
					if(entity==comma) _.instruction_index++								
					_.entity_index++
					index++
					_.showStacks(true)
				}
				_.line_index++
				_.instruction_index++
			}
			_.aya_glob_data.writes = _.writes
			_.aya_glob_data.exprs = _.exprs
			if(_.debug_aya){
				release_logs('debug-aya','Aya debug')
			}	
		}
	
		return await _.process(aya_script,parseScope)
	}


	async prepareJS(){
		let _=this,show_logs=true,debugJs={assignment:[],func_call:[],if:{},else_if:{},else:{}}, closed_actions={}, closer
		let js='',helper, h2, initial, tabs_repeated,add_tab=0,current_scope,includes_scope_name,closed_actions_count, addBottomComments, anonimous_closed
		let close_assoc={func_call:')',array_assignment:']',array_literal:']',func_decl:"}",if:"}",else:"}",key_expression:']',object_assignment:"}",loop:"}",immediate_call:')',class:"}"}
		let close_priority = ['func_decl','immediate_call'], to_close=[], index, range, aya_import, classes=[], initiates=[]
		let aya_import_string = `window.aya_import = async sr=> (await new Promise(r=>{let d=document,s=d.createElement('script');s.async=true;s.onload=()=>r();s.src=sr;d.getElementsByTagName('head')[0].appendChild(s)}));\n`
		function debug_js(name,w,a='push',scope_id=0,prefix='',suffix=''){			
			if(a!='release'){
				let t,e				
				if(name=='assignment'){
					let from, found=false, i 
					for(let n of ['object_assignment','array_assignment','var_assignment']){
						if(!(t=w.debugJsAssignment)){
							from = w.entity_index
							while(true){
								if(from==-1) break
								t = _.writes[from]
								if(t.start[n]){					
									i=t.end.at[n][t.start[n]]
									if(n=='var_assignment'||_.writes[i].level.assignment>1)	{						
										while(_.writes[i+1]&&(_.writes[i+1].entity==')' 
											|| (_.writes[i+1].hidden && _.writes[i].hidden) 
											|| (_.writes[i+1].level.assignment>1 && !_.writes[i+1].end.var_assignment))){
												i++
										}
									}
									t = _.writes[i]
									found=true
									if(n=='assignment') w.debugJsAssignment=t
									break
								} else if(n!='var_assinment') break
								from--							
							}
						} else found=true
						if(found)break
					}
					e = w.converted||w.entity					
				}
				if(name=='func_call'){
					t=w
					e=a
				}
				if(!t.debugJs) t.debugJs={}
				if(!t.debugJs[name]) t.debugJs[name]=[]
				t.debugJs[name].push(e)
				if(name=='assignment'){
					if(!t.debugJs.scope_id) {
						t.debugJs.scope_id=[]
						t.debugJs.scope_id_length=0
					}
					t.debugJs.scope_id.push(scope_id)
					t.debugJs.scope_id_length++
				}
			} else {
				let obj={},v,str_obj='',r,debugJs=w.debugJs,msg=_.debug_js_assoc[name],nm,i
				if(['func_call','func_call_no_args'].includes(name)) {
					nm=w.func_name||w.scope_start.__data__.entity
					if(!nm)nm='anonimous'
					msg=_.replaceArguments(msg,nm)
				}		
				if(['assignment','func_call'].includes(name)){
					i=0
					for(v of debugJs[name]){
						if(name!='assignment'||debugJs.scope_id[i]===scope_id) {
							obj[v] = v
							if(name=='assignment') {
								debugJs.scope_id[i] = null
								debugJs.scope_id_length--
							}
						}
						i++
					}
					if(name!='assignment'||!debugJs.scope_id.length) debugJs[name]=[]
					else if(name=='assignment'&& Object.keys(obj).length===0) return ''
				}
				r = `save_log('JS debug','${msg}'`
				if(name!='func_call_no_args') {
					str_obj='{'
					i=0
					for(let key in obj){
						if(i) str_obj+=','
						str_obj+='"'
						str_obj+=key.replace(/[^\\]"/g, e=> e[0]+'\\"')
						str_obj+='":'+obj[key]
						i++
					}
					str_obj+='}'
					r+=`,${str_obj}`
				}
				r += `);\n`
				if(w.debugJs&&(name!='assignment'&&w.debugJs[name]||name=='assignment'&&!debugJs.scope_id_length)) {
					delete w.debugJs[name]
					if(name=='assignment'){
						delete w.debugJs.scope_id
						delete w.debugJs.scope_id_length
					}
				}
				if(w.debugJs&&Object.keys(w.debugJs).length === 0) delete w.debugJs				
				return prefix+r+suffix
			}
		}
		function global_func(entity){
			if(_.initiated[entity]===1) return
			if(entity=='log'){
				initiates.push("log=function(){console.log(...arguments)};\n")
			}
			if(entity=='save_log'){
				initiates.push("saved_logs={};save_log=function(){if(!saved_logs[arguments[0]])saved_logs[arguments[0]]=[];saved_logs[arguments[0]].push(Array.from(arguments).slice(1))};\n")
			}
			if(entity=='release_logs'){
				initiates.push("release_logs=function(){console.group(arguments[1]||arguments[0]);if(saved_logs[arguments[0]])for(let l of saved_logs[arguments[0]])console.log(...l);console.groupEnd(arguments[1]||arguments[0]);saved_logs[arguments[0]]=[]};\n")	
			}
			_.initiated[entity]=1					
		}		
		async function get_expr(range,check=false){
			let expr=''
			expr = await parse_range(range[0],range[1],check)
			return expr
		}

		function add_to_converted(symbol,i,where=1){
			if(where) _.writes[i].converted=_.writes[i].converted? 
				symbol+_.writes[i].converted:symbol+_.writes[i].entity
			else _.writes[i].converted=_.writes[i].converted? 
				_.writes[i].converted+symbol:_.writes[i].entity+symbol
		}

		async function construct_loop(from_index){
			let r='',i,n, c=0, range, w, loop_data_range, loop_data={v1:{},v2:{},v3:{}}, parsed_v2, parsed_to, lets, condition, expression, entity
			let for_in,default_expr=false,loop_parent_scope,start_loop_from
			for(i=from_index;i>=0;i--){
				w=_.writes[i]
				if(w.start.loop_data){
					if(w.for_in_loop){
						for_in=true
					}
					for(range of _.exprs[w.level.expr]){
						if(range[0]==i && _.writes[range[1]].end.loop_data){
							loop_data_range=range
							break
						}
					}
					n = _.writes[i+1]
					loop_data.v1 = {entity:n.entity}
					for(range of _.exprs[n.level.expr+(for_in?1:0)]){						
						if(range[0]>loop_data_range[0] && range[1]<loop_data_range[1]){																
							if(!c) {
								if(!for_in) {
									loop_data.expr = await parse_range(range[0],range[1],false)
								}
								else loop_data.v1 = {entity:_.writes[range[0]].entity}
							}
							else if(c==1) loop_data.v2 = {entity:_.writes[range[0]].entity}
							else if(c==2) loop_data.v3 = {entity:_.writes[range[0]].entity}
							else break
							c++
						}
					}					
				}

				if(w.start.loop_to){
					if(w.entity_index==w.end.at.loop_to[1]){
						loop_data.v3.expr = w.variants[1].converted || w.variants[1].entity
						if( _.entityDefined(w.scope,w.variants[1].entity)){
							loop_data.v3.entity = loop_data.v3.expr
						}
						if(w.variants[1].start.func_call) loop_data.v3.expr+='()' 
					}
					else loop_data.v3.expr = await parse_range(w.entity_index,w.end.at.loop_to[1],false,1)
				}

				if(w.start.loop_from){
					if(w.entity_index==w.end.at.loop_from[1]){
						entity = w.variants[0].converted || w.variants[0].entity
						if(!for_in){
							loop_data.v2.expr = entity
							if(w.variants[0].start.func_call) loop_data.v2.expr+='()'
							else if(_.entityDefined(w.scope,w.variants[0].entity)){
								loop_data.v2.entity = loop_data.v2.expr
							}
						}else{
							loop_data.for_in_entity = entity
						}
					}					
					else loop_data.v2.expr = await parse_range(w.entity_index,w.end.at.loop_from[1],false,0)
					loop_parent_scope = w.scope
					start_loop_from = w
					break
				}
			}
			if(!for_in){
				if(!loop_data.v1.entity) {
					loop_data.v1.entity = `$${_.loop_index}iterator`
					_.defineEntity(_.writes[from_index].scope,loop_data.v1.entity,null,true)
				}
				if(!loop_data.v2.entity) {
					loop_data.v2.entity = `$${_.loop_index}from`
					_.defineEntity(_.writes[from_index].scope,loop_data.v2.entity,null,true)
				}
				if(!loop_data.v3.entity) {
					loop_data.v3.entity = `$${_.loop_index}to`
					_.defineEntity(_.writes[from_index].scope,loop_data.v3.entity,null,true)
				}
				let from=''
				if(loop_data.v2.entity!=loop_data.v2.expr) {
					from = `${loop_data.v2.entity}=${loop_data.v2.expr},`
				}
				lets = `let ${from} ${loop_data.v1.entity}=${loop_data.v2.entity}`
				if(loop_data.v3.entity!=loop_data.v3.expr) lets += `,${loop_data.v3.entity}=${loop_data.v3.expr}`
				parsed_v2 = parseFloat(loop_data.v2.expr), parsed_to = parseFloat(loop_data.v3.expr)
				if(loop_data.expr==loop_data.v1.entity||!loop_data.expr) default_expr=true
				if(!isNaN(parsed_v2) && !isNaN(parsed_to)){
					if(parsed_v2>parsed_to) { 
						condition=`${loop_data.v1.entity}>=${loop_data.v3.entity}`
						expression = default_expr? `${loop_data.v1.entity}--`:`${loop_data.v1.entity}=${loop_data.expr}`
					}
					else {
						condition=`${loop_data.v1.entity}<=${loop_data.v3.entity}`
						expression = default_expr? `${loop_data.v1.entity}++`:`${loop_data.v1.entity}=${loop_data.expr}`
					}
				} else {
					condition = `${loop_data.v2.entity}>${loop_data.v3.entity}?${loop_data.v1.entity}>=${loop_data.v3.entity}:${loop_data.v1.entity}<=${loop_data.v3.entity}`
					expression = default_expr?
						`${loop_data.v2.entity}>${loop_data.v3.entity}?${loop_data.v1.entity}--:${loop_data.v1.entity}++`:
						`${loop_data.v1.entity}=${loop_data.expr}`
				}
				r="\n"+repeat(w,false,true)+`for(${lets};${condition};${expression}){`+"\n"
			}else{
				if(!loop_data.v2.entity) {
					loop_data.v2.entity = `$${_.loop_index}key`
					_.defineEntity(_.writes[from_index].scope,loop_data.v2.entity,null,true)
				}
				if(loop_data.v3.entity){
					if(!_.entityDefined(loop_parent_scope,loop_data.v3.entity)){ 
						_.defineEntity(loop_parent_scope,loop_data.v3.entity,null,true)
						r=`\n`+repeat(w,false,true)+`let ${loop_data.v3.entity};`
					}
					if(!start_loop_from.define) start_loop_from.define=[]
					r+="\n"+repeat(w,false,true)+`${loop_data.v3.entity}=-1;`
				}				
				r+="\n"+repeat(w,false,true)+`for(let ${loop_data.v2.entity} in ${loop_data.for_in_entity}){\n${repeat(w,false,false,1)}let ${loop_data.v1.entity}=${loop_data.for_in_entity}[${loop_data.v2.entity}];`+"\n"
				if(loop_data.v3.entity) r+="\n"+repeat(w,false,true,1)+`${loop_data.v3.entity}++;\n`
			}
			_.loop_index++
			return r
		}

		function repeat(wn,scope_start=false,this_index=false,correct=0,show){
			if(tabs_repeated) return ''
			let r
			if(wn.repeat_tab) {
				r=wn.repeat_tab+add_tab+correct
				if(r<0) r=0	
				return "\t".repeat(r)
			}
			let i=wn.entity_index,add=initial&&!wn.start_class?1:0		
			while(wn){
				if(!scope_start&&!wn.hidden&&!wn.has_backslash||scope_start&&wn.scope_start||this_index) {
					if(scope_start&&i) {
						i--
						wn=_.writes[i]
					}
					show&&console.trace(i,wn.entity,wn,	wn.tab,add,add_tab,correct)
					wn.repeat_tab = wn.tab+add
					r = wn.repeat_tab+add_tab+correct
					if(r<0) r=0		 
					return "\t".repeat(r)
				}
				scope_start?i--:i++
				if(!_.writes[i]) break
				wn=_.writes[i]
			}
			return "\t".repeat(wn.tab)
		}

		function scope_started(i){
			while(_.writes[i]){
				if(_.writes[i].scope_start) return _.writes[i]
				i++
			}
			return {}
		}

		function instruction_ends(js,only_n=false){
			let l=js[js.length-1]
			if(l==`\t`) return ''
			let r=l=="\n"
			if(only_n) return r?'':"\n"		
			return r&&js[js.length-2]==";"?'':";\n"
		}

		function add_bottom_comments(w){
			if(w.added_bottom_comments) return ''
			let js='',comments
			w.added_bottom_comments = true
			if(w.line_last_entity){
				comments=_.aya_glob_data.struct[w.struct_index][2][0]
				if(comments) js+= "\t"+comments+"\n"
				_.aya_glob_data.struct[w.struct_index][2][0]=''						
			}
			comments = _.aya_glob_data.struct[w.struct_index][2][2]
			for(let comment of comments) js+="\n"+repeat(w)+comment
			_.aya_glob_data.struct[w.struct_index][2][2]=[]
			return js
		}

		async function parse_range(from,to,check=true,variant=null){
			let js='',w,n,p,separators={},level_expr,i,scope,scope_vars,scope_args,v,k,def,hidden,aya,initial_
			let end_func_call, end_array_literal, action_levels={},action,actions_started,exprs,arrow_args
			function set_separators(name,sep=','){
				let level = w.level[name], exprs=[]	
				for(let i2 in _.exprs[w.level.expr+1]){
					level_expr=_.exprs[w.level.expr+1][i2]
					//-- filter appropriate arguments related expressions (except last)
					if(level_expr[0]>i&&level_expr[1]<w.end.at[name][level]){
						exprs.push(level_expr)						
					}
				}
				if(exprs.length && name=='immediate_func_call') exprs.pop()
				if(exprs.length){
					for(let expr of exprs){
						separators[expr[1]] = sep
					}
				}	
				return separators			
			}
			if(!from)from=0
			if(!to){
				initial_=true
				to=_.writes.length-1
			}else initial_=false
			for(i=from;i<=to; i++){
				addBottomComments=null
				tabs_repeated=false
				initial=initial_
				w=_.writes[i]
				current_scope = w.scope
				if(variant!==null&&_.writes[i].variants){
					w=_.writes[i].variants[variant]
				}
				hidden = !check? false : w.hidden	
				if(w.func_decl.stage==1&&!w.start.func_decl&&check) continue
				if([',,'].includes(w.entity)) continue
				n=_.writes[i+1]
				p=_.writes[i-1]
				if(p&&p.catch_error){
					add_tab++
				}

				if(w.line_first_entity){
					if(initial&&!w.start_class || !initial){
						helper = _.aya_glob_data.struct[w.struct_index][2][1]
						for(let comment of helper) js+= "\n"+repeat(w)+comment+"\n"
						helper = _.aya_glob_data.struct[w.struct_index][2][3]
						if(helper) js+= "\n"+repeat(w)+helper+"\n"
						_.aya_glob_data.struct[w.struct_index][2][1]=[]
						_.aya_glob_data.struct[w.struct_index][2][3]=''
					}						
				}
				if((scope=w.scope_start)&&check){ 
					if(_.scope_names.includes(w.scope_start.__data__.type) || w.scope_start.__data__.type=='function'){
						if(!w.scope_tabbed) {
							add_tab++
						}
					}
					if(w.start.loop){
						js += await construct_loop(i)
					}					
					scope_vars=[]
					for(v of scope.__data__.assignments){
						if(scope[v].__data__.type&&scope[v].__data__.type!='function')v+='='+_.assoc[scope[v].__data__.type]
						scope_vars.push(v)
					}				
					if(scope_vars[0]) {
						js+="\n"+repeat(w,false,false,w.start_class?1:0)+'let '+scope_vars.join(',')+";\n"
					}
					if(scope.__data__.arguments[0]){
						try{
							helper=i
							while(true){
								helper--
								if(_.writes[helper].start.func_decl){
									if(_.writes[helper-1]&&_.writes[helper-1].is_get) _.error(12)
									break
								}
							}
						}catch(err){
							_.errorType(4,w.line_index)												
							_.showTerminatedInput(w.index,w.line_index)
							return js
						}
					}
					scope_args=[]
					k=0
					for(v of scope.__data__.arguments){
						def=scope.__data__.defaults[k]
						scope_args.push( `${v}=${scope.__data__.arrow?arrow_args:'arguments'}[${k}]${def&&('||('+def+')')||''}` )
						k++
					}
					if(scope_args[0]) {
						helper = repeat(w)+'let '+scope_args.join(',')+";\n"
						h2=w
						js+=helper
						if(_.debug_js){
							for(let arg of scope.__data__.arguments){
								debug_js('func_call',h2,arg)
							}
							if(w.entity!='super') js += debug_js('func_call',w,'release',null,repeat(w))
							else h2.func_name = w.scope_start.__data__.entity
						}						
					} else if(w.scope_start.__data__.type=='function') {
						if(_.debug_js) js += debug_js('func_call_no_args',w,'release',null,repeat(w))
					}
					_.writes[i].scope_start.__data__.assignments = []
					_.writes[i].scope_start.__data__.arguments = []
				}
				if(w.start.class&&initial){
					classes.push(await parse_range(i,i=w.end.at.class[1]))
					continue					
				}				
				if(w.define&&check) {
					for(let def of w.define) {
						js+=`\n`
						if(def[2]) {
							js+=repeat(w)+`if(!${def[0]})`
							helper='repeated'							
						}
						js+=(helper=='repeated'?' ':repeat(w))+`${def[0]}=${def[1]};`+"\n"
					}
				}
				if(w.start.immediate_call) {
					if(!w.scope_tabbed) js+=instruction_ends(js,true)
					if(js[js.length-1]!=`\t`) js+=repeat(w)
					js+=`(`
				}
				if(w.start.func_decl&&!w.arrow&&!w.class_entity&&(!p||p&&!p.is_set&&!p.is_get)) {					
					if(w.line_first_entity && !w.start.immediate_call) js+="\n"+repeat(w)
					js+='function '
					tabs_repeated=true
				}
				if(w.return) {
					js+="\n"+repeat(w)+'return '
					tabs_repeated=true
				}
				if(w.start.obj_key&&w.obj_key_expr) {
					js+=repeat(w)					
					js+='['
					tabs_repeated=true					
				}
				if(w.start.func_call && _.initiated[w.entity]===0){
					global_func(w.entity)
				}
				if(w.add_tab_minus){
					add_tab--
					delete w.add_tab_minus
				}					
//-- entity/converted
				if(!hidden){
					if(!w.hidden && (w.scope_start || w.line_first_entity||['?'].includes(w.entity)||['key_value','set_get'].includes(w.obj)||w.start.obj_key) && ![';'].includes(w.entity) && !['else if'].includes(w.converted)) {						
						if(w.preceding_comma){
							if(js[js.length-2]!=',') js+=','+"\n"
							w.converted = w.converted.substring(1)
						}
						if(!w.start.immediate_call){
							if(!tabs_repeated&&!w.scope_start) js+="\n"
							js+=repeat(w)
						}
						tabs_repeated=true
					}
					if(n&&n.start.immediate_call){
						_.writes[w.entity_index+1].async=true

					}
					if(w.start.key_expression) {
						js+='['
					}					
					js+=(w.converted!==undefined?w.converted:w.entity)
				}			
				if(w.start.func_decl) {
					if(w.arrow){						
						if(w.entity!='~')js+='='
						arrow_args=helper=''
						if(w.scope.__data__.arguments[0]){
							arrow_args = '__args'+_.args_index
							helper = '...'+arrow_args
						}
						if(p.start.immediate_call) {
							js+=`${p.async?' async ':''}`
						}													
						js+=`(${helper})=>{`+"\n"
						_.args_index++
					}else {
						helper=''
						if(w.set_get&&p.is_set){
							helper=current_scope.__data__.arguments[0]
							current_scope.__data__.arguments.shift()

						}
						js+=`(${helper}){\n`
					}
					if(n){
						exprs=[]
						if(_.exprs[w.level.expr+1])
							for( let range of _.exprs[w.level.expr+1] ){				
								if(!_.writes[range[0]].start.default || range[0]>w.end.at.func_decl[1] || range[1] < i) continue
								exprs.push( await get_expr(range) )
							}
					}
					if(!w.scope) _.error(6)
					else w.scope.__data__.defaults = exprs
				}
				//-- separators between arguments (as expressions) of func call
				if(w.start.func_call && !hidden) {
					js+='('
					if(!w.end.func_call){
						separators = set_separators('func_call')
					}
				}
				//-- separators between expressions on array assignment
				if(w.start.array_assignment && n.assignment.type=='array' && !hidden) {
					separators = set_separators('array_assignment',w.push?`);${w.entity}.push(`:',')
				}
				//-- separators between expressions on array literal
				if(w.start.array_literal && !hidden){
					separators = set_separators('array_literal')
				}
				if(w.start.immediate_func_call && !hidden){
					separators = set_separators('immediate_func_call')
				}
				if(n&&(w.assignment.stage<n.assignment.stage||[1,2].includes(w.assignment.stage)||w.assignment.type=='array'||w.chain_assignment)&&!hidden) {
					if((w.start.array_assignment || w.start.object_assignment || w.start.var_assignment || w.assignment.stage<n.assignment.stage) && !w.push && !w.start.array_literal && !w.anonimous && w.obj!='key' && !w.end.var_assignment) {
						if(w.end.key_expression) w.has_equal=true
						else js+='='
					}
					if(n.assignment.stage==3 && w.assignment.type=='array' && w.start.array_assignment) {
						if(!w.push) js+='['
						else js+='.push('
					}
				}				

				if(w.entity==';'&&n.scope_start) js+="{\n"
				if(w.start.object_assignment&&w.assignment.type=='object') {
					if(w.obj!='key'){
						js+="{"
						if(!w.anonimous||!w.end.object_assignment)js+="\n"
					}
					if(!scope_started(i+1).scope_tabbed){
						add_tab++
					}
				}
				if(_.debug_js&&!hidden){
					if(w.assignment.stage<3&&!w.start.func_call){
						if(!w.scope.__data__.className) debug_js('assignment',w,'push',current_scope.__data__.id)
					}
				}			
				if((!w.start.object_assignment||w.semicolon) 
					&& !w.start.key_expression && !w.end.key_expression 
					&&(n&&n.entity!=','&&!n.continue_chain&&n.entity!=';'||!n)
					&&js[js.length-1]!=';'&&check&&!hidden&&(!w.end.immediate_call&&(!_.allSigns.includes(w.entity))
					&&((!w.level.expr&&!w.unassignable||w.semicolon)&&!['?',';'].includes(w.entity)&&(n&&![';',','].includes(n.entity)||!n))
					&&(n&& !['key','key_value'].includes(n.obj)||!n)&&!['key','key_value'].includes(w.obj) 
						|| w.end.var_assignment&&(!n||n.entity!=')')) && !['func_call'].includes(w.recent_action) && js[js.length-1]!="\n" 
						|| w.end.func_decl 
						|| w.end.if 
						|| !['?',';'].includes(w.entity)&&w.end.else 
						|| w.end.loop) {
					if(w.recent_action!='func_call'&&w.has_semicolon!==false&&!w.catch_error)w.has_semicolon=true
				}			
				closed_actions_count=0
				closed_actions={}
				if((check&&!w.hidden || !check&&w.hidden) || w.emitter){
					actions_started={}					
					includes_scope_name=false
					for(let key in close_assoc){					
						for(let l in w.start.at[key]){
							if(!actions_started[w.start.at[key][l]]) 
								actions_started[w.start.at[key][l]]=[]
							actions_started[w.start.at[key][l]].push(key)
							!closed_actions[key]? (closed_actions[key]=1) : closed_actions[key]++
							if(_.scope_names.includes(key)) includes_scope_name=true
						}
					}
					if(!closed_actions.func_call && !closed_actions.object_assignment && !closed_actions.array_assignment && !closed_actions.array_literal){
						if(_.debug_js && w.debugJs){	
							if(w.debugJs.assignment) {
								w.has_semicolon=false
								js+=instruction_ends(js)
								js+=debug_js('assignment',w,'release',current_scope.__data__.id,instruction_ends(js)+repeat(w))
							}
						} else if(w.has_semicolon) {							
							if(w.entity)js+=";"
							if(addBottomComments!==false){
								js+=add_bottom_comments(w)
								addBottomComments=false
							}
							w.has_semicolon=false
						}						
					}
					actions_started = Object.entries(actions_started).reverse()											
					for(let d of actions_started){
						if(action_levels[d[1]]===undefined) action_levels[d[1]] = w.end[d[1]]
						if(w.else_if&&d[1]=='else')continue	
						if(!(w.hide_else_close&&d[1]=='else')) {											
							for(let name of d[1]) {
								if(close_priority.includes(name)) continue
								includes_scope_name	= _.scope_names.includes(name)
								tabs_repeated=false
								helper = +d[0]
								if(!scope_started(helper+1).scope_tabbed&&includes_scope_name) {
									add_tab--
								}
								closer=close_assoc[name]
								closed_actions[name]--
								if(includes_scope_name){
									if(!w.anonimous)current_scope=current_scope.__data__.parentScope
									if(!closed_actions.object_assignment && !closed_actions.array_assignment && !closed_actions.array_literal && !['object_assignment','array_assignment','array_literal'].includes(name)) {
										if(_.debug_js && w.debugJs && w.debugJs.assignment&&!w.end.func_call) {
											w.has_semicolon=false
											js+=instruction_ends(js)
											js+=debug_js('assignment',w,'release',current_scope.__data__.id,"\n"+repeat(w,false,false, -closed_actions_count ),"\n")
										}
										if(w.has_semicolon){
											js+=";"
											if(addBottomComments!==false){
												js+=add_bottom_comments(w)
												addBottomComments=false
											}
											w.has_semicolon=false
										}									
									}
									closed_actions_count++
								} else if(name=='array_assignment'&& _.writes[w.start.at.array_assignment[w.end.array_assignment]].push){
									closer=')'
								}							
								if(includes_scope_name||w.tab!=_.writes[helper].tab) {
									if(!(['object_assignment','array_literal'].includes(name)&&w.anonimous)||anonimous_closed){
										js+="\n"
										js+=repeat(_.writes[helper],false,true)
									}
								}								
								js+=closer
								if(w.anonimous) anonimous_closed=true																
							}				
							for(let name of close_priority){							
								if(closed_actions[name] && d[1].includes(name)){	
									tabs_repeated=false
									helper = +d[0]
									if(!scope_started(helper+1).scope_tabbed&&name=='func_decl') {
										add_tab--
									}									
									closed_actions[name]--
									if(name=='immediate_call'){
										js+=close_assoc[name]
										helper = n.entity==',,'? _.writes[i+2] : n
										range = [helper.entity_index,helper.end.at.immediate_func_call[1]]
										js += await get_expr(range)
									}else{
										if(w.has_semicolon){
											js+=";"
											if(addBottomComments!==false){
												js+=add_bottom_comments(w)
												addBottomComments=false
											}
											w.has_semicolon=false
										}											
										if(_.debug_js && w.debugJs && w.debugJs.assignment) {
											js+=debug_js('assignment',w,'release',current_scope.__data__.id,"\n"+repeat(w,false,false,-closed_actions_count),"\n")
										}								
										includes_scope_name=true	
										if(w.scope.__data__.type!='object'&&w.has_semicolon===undefined)w.has_semicolon=true							
										js+="\n"+repeat(_.writes[helper],false,true)
										if(!current_scope.__data__.arrow)current_scope=current_scope.__data__.parentScope
										js+=close_assoc[name]								
									}
									closed_actions_count++
								}
							}						
						}
						action_levels[d[1]]--				
					}
					_.writes[i].close_managed=true
				}
				if(w.entity=='?'){
					js+='('					
					js+=await get_expr(_.longestRecentExprRange(w.entity_index,1))
					js+="){\n"
				}
				if(w.entity=='@'&&w.import){
					helper = _.cutSides(w.import)
					if(helper.substring(helper.length-4)=='.aya'){
						if(w.gathered){
							if(!aya_import){
								initiates.push(aya_import_string)
								aya_import=true
							}
							helper=false						
							let scripts = document.getElementsByTagName('script')
							for(let script of scripts){
								if(script.src.includes('Aya.js')){
									helper = script.src.split('?')[0]
									break
								}
							}
							if(!helper) console.error('Aya.js script has not found. Have you renamed it?')						
							if(!_.imported[helper]){
								_.imported[helper] = true
								js+="\n"+repeat(w,false,true)+`window.AYA_dontRun = true;`+"\n"
								js+="\n"+repeat(w,false,true)+`await aya_import('${helper+'?'+(+new Date())}');`+"\n"
								js+="\n"+repeat(w,false,true)+`window.AYA = new Aya(false,{imported:'${JSON.stringify(_.imported)}'})`+"\n"
								
							}
							helper = w.import
							if(!_.imported[helper]){
								_.imported[helper]=true
								js+="\n"+repeat(w,false,true)+`window.aya_script = await AYA.loadScript(${helper});`+"\n"
								js+="\n"+repeat(w,false,true)+`AYA.compile_aya_script = true;AYA.eval = false;`+"\n"
								js+="\n"+repeat(w,false,true)+`window.aya_js = await AYA.workout(window.aya_script,{imported:'${JSON.stringify(_.imported)}'});`+"\n"						
								js+="\n"+repeat(w,false,true)+`eval(window.aya_js);`+"\n"
							}
						} else {
							if(!_.imported[helper]){
								_.imported[helper]=true
								helper = await _.loadScript(helper)
								aya = new Aya(false,{imported:JSON.stringify(_.imported)})
								js += await aya.workout(helper)
							}
						}
					}
					else if(/^(http(s?)):\/\//i.test(helper)){
						if(!_.imported[helper]){
							if(!aya_import){
								initiates.push(aya_import_string)
							}
							js+="\n"+repeat(w,false,true)+`await aya_import('${helper}');`+"\n"
							aya_import=true
							_.imported[helper] = true
						}
					}else if(!w.dots_count){
						js+=repeat(w,false,true)+`await import('${helper}');`+"\n"
					}
				}				
				if(w.entity=='}'){
					if(n&&n.anonimous&&n.start.func_decl){
						helper = n.end.at.func_decl[n.level.func_decl]
						_.writes[helper+1].entity==',,'? helper+=2:helper++
						helper = _.writes[helper].end.at.immediate_func_call[1]
						tabs_repeated=false
						_.writes[helper].converted=_.writes[helper].entity+";\n"+repeat(_.writes[helper],false,true)+"}\n"
						_.writes[helper].add_tab_minus=true
					} else js+="\n"+repeat(w)+"}\n"
				}
				if(w.end.obj_key&&w.obj_key_expr) js+=']'
				if(w.end.obj_key&&w.obj!='key_value') js+=':'
				if(w.has_equal) js+="="
				if(w.start.object_assignment&&w.assignment.type=='object'&&w.obj=='key') js+="{\n"
				if(w.has_semicolon&&(!n||n&&!n.preceding_comma)&&!w.end.immediate_call&&!w.end.immediate_func_call&&!w.catch_error){
					js+=";\n"
					if(addBottomComments!==false){
						js+=add_bottom_comments(w)
						addBottomComments=false
					}
				}
				if(w.end.obj_value&&!w.end.object_assignment&&!w.start.func_decl&&!w.end.func_decl || (n&&(n.obj=='key'&&w.level.assignment>n.level.assignment||w.obj=='value'&&n.obj=='set_get')) ) js+=",\n"
				if(!hidden && separators[i]) js+=separators[i]
				if(w.emits){
					for(let emit of w.emits){
						js+="\n"+repeat(w)+`${emit[0]}(${emit[1]});`+"\n"
					}
				}
				if(_.debug_js && w.debugJs) {
					if(w.debugJs.assignment) {					
						if(w.has_semicolon===undefined) js+=instruction_ends(js)
						js+=debug_js('assignment',w,'release',current_scope.__data__.id,"\n"+repeat(w,false,false,0),"\n")
					}
				}
				if(n&&n.entity==','&&w.has_semicolon!==undefined) {
					n.hidden=true
				}
			}
			return js			
		}
		if(_.debug_js){
			global_func('save_log')
			global_func('release_logs')
		}	
		js = await parse_range()
		if(_.terminated) console.log('%cUnfinished output JS:','font-weight:bold;color:#777')		
		if(!_.aya_script&&!_.terminated) {
			let inis=''
			if(initiates[0]) {
				for(let ini of initiates) inis+=ini
				inis+="\n"
			}
			js=inis+"(async ()=>{\n"+js
		}
		if(_.debug_js&&_.dev){
			js+="\n\t"+`release_logs('JS debug');`
		}		
		if(!_.aya_script&&!_.terminated) js+="\n})()"
		helper=''
		for(let C of classes) helper+=C
		if(helper) helper+="\n"
		js = helper + js
		js = js.replace(/\n+/g,"\n")
		if(_.dev) console.log(js)	
		return js
	}

	linesToStruct(lines){
		let _ = this
		let line,ts,d,es=[],struct=[],distances=[],_lines=[],ss=[],ss2=[],m,m2,s,r,i=0,l,n,multi_line='',parts,prev_d
		let sign,sign2,variants=[],variants2=[],pairs=[],a,b,bf='',af='',pat, str_assoc={},multi_comment,multi_comment_started,side_comment='',solo_side_comment='',top_comments=[], multi_comments=[], comments_arr=[]
		for(l=0;l<lines.length;l++){
			line = lines[l]
			if(multi_comment){
				multi_comments.push(multi_comment)			
				m = /\*\//.exec(line)
				if(!m){
					multi_comment=line
					continue
				}else{
					multi_comment=line.substring(0,m.index+2).trim()
					line=line.replace(multi_comment,'')
					multi_comments.push(multi_comment)
					multi_comment=false
				}
			}
			while(true){
				m = line.match(/(^|[^\\`])`/g)
				if(m&&m.length % 2 != 0){
					line+="\n"		
					l++
					while(lines[l]){
						m = /(^|[^\\`])`/.exec(lines[l])
						if(!m) line+=lines[l]+"\n"
						else{
							line+=lines[l]
							break
						}
						l++
					}
				} else break			
			}
	
			line = line.replace(/\s+$/, '')
			if(!line) continue

			ts = line.match(/\t*?[^\t]/)
			d = (ts[0].match(/\t/g) || []).length
			distances.push(d)
			if(!ts) continue			
			
			line = line.replace(/\$\{.*?\}/g,e=>{
				return '`+('+e.substring(2,e.length-1)+')+`'
			})
			
			line = line.substr(d)
			line = line.replace(/\t/g,' ')
			line+=' '
			
			//-- work with line literals (disable space character confusion)
			ss=es=ss2=[]
			;[line,ss] = _.temporaryReplaceStrings(line)
			if(line.includes('#')){
				parts = line.split('#')
				line=parts[0]								
				solo_side_comment='//'+parts[1]
				if(!line){
					side_comment=solo_side_comment
					solo_side_comment=''
				}
			}
			while(true){
				m = /\/\*/.exec(line)
				if(m){
					m2 = /\*\//.exec(line.substring(m.index))
					if(m2){
						multi_comment = line.substring(m.index,m2.index+2)
						multi_comments.push(multi_comment)
						line=line.replace(multi_comment,'')																																
						if(!line.trim()) {
							multi_comment=false
							break
						}
					} else {
						multi_comment = line.substring(m.index).trim()
						line=line.replace(multi_comment,'')
						break								
					}
				} else break
			}

			line=line.trim()

			if(multi_comment){
				multi_comment = _.temporaryReplaceStrings(multi_comment,false,ss)
			}
			if(solo_side_comment){
				solo_side_comment = _.temporaryReplaceStrings(solo_side_comment,false,ss)
			}	
			if(side_comment){
				side_comment = _.temporaryReplaceStrings(side_comment,false,ss)
			}				
			if(!line) continue
			else if(multi_comment){
				multi_comment_started=true
			}
			_lines.push(ss[0]? _.temporaryReplaceStrings(line,false,ss) : line)	
			
			//-- work with regexes (..)
			;[line,ss2] = _.temporaryReplaceRegexes(line)

			//-- work with signs and spaces aroud them
			let sSigns=[[],[],[],[],[]]
			sSigns[10] = []
			for(sign of _.allSigns){
				if(sign!='!'){
					sSigns[sign.length].push(sign)
				}
			}
			let iter=-1,collect=[]
			for(let i=4;i>=1;i--){
				for(sign of sSigns[i]){
					let s=''
					for(let n=0;n<sign.length;n++){
						s+=`\\${sign[n]}`
					}
					line = line.replace(new RegExp(`${s}`,'g'), e=> {
						iter++
						collect.push(e)
						return `#\\[${iter}]` 
					})
				}				
			}
			
			line=line.replace(/#\\\[([\d]+)\]/g,(e,n)=>{
				return ` ${collect[n]} `
			})
			line = line.replace(/ +/g,' ')

			for(sign of _.magnetLeft){ 
				line = line.replace(new RegExp(`[^${sign}]{1}${sign}[^${sign}]{1}`,'g'), e=> {
					return e.length==3? e[0]+e[1]+' '+e[2] : e[0]+' '+e[1]
				})
			}
			line = line.replace(/[\&\|\=^'"`\(\!] \! [^\=\!]/g,e=> `${e[0]} ${e[2]}${e[4]}`)
			line = line.replace(/ +/g,' ').trim()
			line = line.replace(/\.\s\.\(/g,'..(')	

			es = line.split(' ')

			for(let e in es){										
				;[es[e],] = _.temporaryReplaceRegexes(es[e],false,ss2)
				if(es[e].includes('$\\')) {
					es[e] = es[e].replace(/\$\\([\d]+)/g,(a,m)=>{
						return ss[m]
					})
				}
			}
			comments_arr = [solo_side_comment,[],[],side_comment]
			if(!multi_comment_started) {
				if(struct.length&&prev_d==d) struct[struct.length-1][2][2]=multi_comments
				else {
					comments_arr[1] = multi_comments
				}
				multi_comments=[]
			} else multi_comment_started=false
			struct.push([d,es,comments_arr])			
			solo_side_comment='',side_comment=''
			prev_d=d
			i++
		}
		_.aya_glob_data.lines=_lines
		_.currentLines = _lines
		return struct
	}	

	helper(){
		let _=this
		//-- tests logs
	    window.log = function() { if(_.test&&!_.turnOffTest)console.log(...arguments) }
		window.saved_logs={};window.save_log=function(){if(!saved_logs[arguments[0]])saved_logs[arguments[0]]=[];saved_logs[arguments[0]].push(Array.from(arguments).slice(1))};
		window.release_logs=function(){console.group(arguments[1]||arguments[0]);if(saved_logs[arguments[0]]) for(let l of saved_logs[arguments[0]])console.log(...l);console.groupEnd(arguments[1]||arguments[0]);saved_logs[arguments[0]]=[]};    
		window.aya_import = async sr=> (await new Promise(r=>{let d=document,s=d.createElement('script');s.async=true;s.onload=()=>r();s.src=sr;d.getElementsByTagName('head')[0].appendChild(s)}));
		window.addEventListener('error', e=>{
			event.preventDefault()
		})
		Object.defineProperty(window,'dev',{
			set: val=>{
				let aya = JSON.parse(localStorage.getItem('aya')||{})
				aya.dev = val
				localStorage.setItem('aya',JSON.stringify(aya))
			}, configurable: true
		})
	}

	storage(a,b,c,d,e){
		let _=this, w = a===true ? 1:0, aya = JSON.parse(localStorage.getItem('aya')||'{}')
		if(!w) {
			if(aya[a]===undefined) return null
			if(b!==undefined) {
				if(aya[a][b]===undefined) return null
				if(c!==undefined) return aya[a][b][c]
				else return aya[a][b]
			}
			else return aya[a]
		}
		else{
			if(d!==undefined) {
				if(aya[b]===undefined)aya[b]={}
				if(e!==undefined){
					if(aya[b][c]===undefined)aya[b][c]={}
					aya[b][c][d]=e
				} 
				else aya[b][c]=d
			} else aya[b]=c
			localStorage.setItem('aya',JSON.stringify(aya))
		}
	}
	
	//-- data template for scope
	createScopeTemplate(object,parentScope,type=null,force=false){
		if(!object.__data__||force){
			object.__data__ = {
				type,
				childScopes:[],
				parentScope,
				assignments:[],
				arguments:[],
				defines:[],
				defaults:[],
				arrow:null,
				id:this.scope_id,
				inProcess:false	
			}
			this.scope_id++
		} 
	}

	getScope(object,n=null){
		if(n===null){
			object.__data__.childScopes.push({})
			return object.__data__.childScopes[object.__data__.childScopes.length-1]
		} else return object.__data__.childScopes[n]
	}

	record(name,value){
		let _=this
		if(name===undefined) return _.records[_.level.record] || {}
		if(name===true) {
			_.level.record++
			_.records[_.level.record] = {status:false,def:'',level_expr:0,defines:[],entities:[],entity_indexes:[]}			
		} else				
		if(name===false) {
			delete _.records[_.level.record]
			_.level.record--
		}else if(value!==undefined){
			if(typeof _.records[_.level.record][name] == 'object') _.records[_.level.record][name].push(value)
			else _.records[_.level.record][name] = value
		}
	}

	async loadScript(path){
	  return new Promise(async result=>{
	  	if(path.substring(path.length-3)=='.js'){	  		
	  		await aya_import(path)
	  		result()
	  	}else{
		  	let xhr = new XMLHttpRequest()
		  	if(!path.includes('?')) path+='?'
		  	path += (+ new Date())
		  	xhr.open("GET",path)
		  	xhr.onreadystatechange = function () {
			   	if(xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
			      	result(xhr.responseText)
			    }
		  	}
		  	xhr.send()
	  	}
	  })	
	}

	longestRecentExprRange(entity_index,add=0){
		let _=this, min=Infinity,range,longest
		for(let l in _.exprs){
			for(let i in _.exprs[l]){
				range=_.exprs[l][i]
				if(range[1]==entity_index-add && range[0]<min) {
					min=range[0]
					longest=range
				}
			}
		}
		return longest
	}

	startIncrementOfMaxValue(obj,to=null){
		let values = Object.values(obj), val, max=0
		for(let val of values){
			if(val>max && (to===null || val<to)) max=val
		}
		while(true){
			if( values.includes(max-1)) max--
			else break
		}
		return max
	}

	temporaryReplaceStrings(entity,forth=true,ss=[]){
		let _=this,s,m,from,to,found
		if(forth){
			for(m of entity.matchAll(/("|'|`).*?(?<!\\)\1/gms)) if(m) ss.push(m[0])
			for(s in ss){
				entity = entity.replace(ss[s],'$\\'+s)
			}			
			return [entity,ss]	
		} else {
			for(s in ss){
				found =	entity.indexOf('$\\'+s)
				if(found>-1)entity = entity.substring(0,found)+ss[s]+entity.substring(found+('$\\'+s).length)
			}
			return entity
		}
	}

	literal(entity){
		let _=this,type,int,fl
		int = parseInt(entity)
		fl = parseFloat(entity)
		if(entity===undefined) return false
		else if(entity=='..') type='array'
		else if(entity=='::') type='object'
		else if(!isNaN(int) && int != fl ) type = 'float'
		else if(!isNaN(int) && fl == int) type = 'integer'
		else if(entity[0]==entity[entity.length-1] && ['"',"'",'`'].includes(entity[0]) && entity.length>1) type='string'
		else if(entity=='N') type = 'null'
		else if(['T','F'].includes(entity)) type = 'boolean'
		else if(entity=='U') type = 'undefined'
		else if(entity=='I') type='Infinity'
		else if(entity[0]=='/') {
			let parts = entity.split('.')
			if( ['exec','test'].includes(parts[parts.length-1])) type='function'
			else type='regex'
		}
		else type = false
		return type
	}

	entityDefined(scope,entity,not_object_scope=false,include_assignment=false,flag=''){
		let entity_=entity
		if(entity=='window') return this.window
		if(typeof entity=='object'){
			if(entity.type.type!='assignable') return null
			if(entity.defined&&(!not_object_scope||!scope.__data__.objectScope)&&not_object_scope!='window') return entity.defined
			entity_=entity.entity
		}
		let _=this,r=null, untill, untill_function, untill_window, in_process
		if(typeof not_object_scope=='string'){
			if(not_object_scope=='function')untill_function=true
			else if(not_object_scope=='window')untill_window=true
			else untill=not_object_scope
			not_object_scope=false
		}	
		if(flag=='in_process') in_process=true	
		let _scope = scope		
		if(entity_=='this') {
			while(true){
				if(!_scope) break
				if(!['function','class'].includes(_scope.__data__.type) || _scope.__data__.classEntity || _scope.__data__.arrow) {
					_scope = _scope.__data__.parentScope
				}									
				else break
			}
			if(!_scope) return _.window['this']
			else if(_scope.this) return _scope.this
			else return _scope 
		}
		let assignments=_.assignments[_.assignment_level], includes
		if(assignments.entities) includes=assignments.entities.includes(entity_)
		while(true){	
			
			if(untill_window && _scope.is_window_scope) {
				r=null
				break
			}


			if(_scope[entity_]&&!_scope[entity_].__data__ && ['function','object'].includes(typeof _scope[entity_])){ 				
				return _.defineEntity(scope, entity,typeof _scope[entity_],true,false,false,true)
			}


			if(_scope[entity_] && _scope[entity_].__data__ && (!_scope[entity_].__data__.inProcess||in_process) && (!not_object_scope || (!_scope.__data__.objectScope && _scope.__data__.type!='object')) || _scope.is_window_scope && typeof window[entity_]!='undefined' ) {
				if(!include_assignment || !(assignments.scope&&_scope.__data__.id == assignments.scope.__data__.id&&includes))					
					if(_scope[entity_] || _scope.is_window_scope && !['undefined'].includes(typeof window[entity_])) {
						r = _scope.is_window_scope&&(!_scope[entity_]||!_scope[entity_].__data__)?{__data__:{parentScope:_scope,type:typeof window[entity_],inWindow: window[entity_]},entity:entity_}:_scope[entity_]
						break
					}
			}			
			if(_scope.__data__.inWindow&&_scope.__data__.inWindow[entity_]){
				r = {__data__:{parentScope:_scope,type:typeof _scope.__data__.inWindow[entity_],inWindow: _scope.__data__.inWindow[entity_],entity:entity_}}
				break
			}
			if(untill_function && _scope.__data__.type=='function') return null
			_scope = _scope.__data__.className? _.window :  _scope.__data__.parentScope
			if(untill && _scope && _scope[untill]) {
				return null
			}
			if(!_scope) {
				break
			}
		}
		if(typeof entity=='object') {
			if(untill_window&&entity.defined){}
			else entity.defined = r
		}
		return r
	}

	defineEntity(scope,entity,type=null,dont_assign=false,as_argument=false,inProcess=false,chained=false){
		let _=this,entity_,record=_.record(),has_in_args
		
		if(typeof entity=='object'){
			entity_=entity.entity
		}else entity_=entity
		if(record.def&&!chained){
			_.record('defines',arguments)
			_.record('entities',entity_)		
			_.record('entity_indexes',_.entity_index)		
			return
		}
		
		if(entity_=='this') {
			while(true){
				if(!['object','function','class'].includes(scope.__data__.type) || scope.__data__.classEntity || scope.__data__.arrow) 
					scope = scope.__data__.parentScope
				else break
			}
		}
		if(!scope.__data__.entity!='this'&&entity_!='this'&&entity_!='super' && !scope[entity_] && !dont_assign && type!='function' && !scope.__data__.objectScope || type=='arrow_function'){
			if(!as_argument) {
				if(!scope.__data__.assignments.includes(entity_)){
					scope.__data__.assignments.push(entity_)
				}
			}
			else {
				while(scope.__data__.type!='function'){
					scope=scope.__data__.parentScope
				}
				if(!scope.__data__.arguments.includes(entity_))
					scope.__data__.arguments.push(entity_)
			}
			if(type=='arrow_function') type='function'
		}
		scope[entity_] = {__data__:{type,inProcess,parentScope:scope,entity:entity_}}
		if(typeof entity=='object') {		
			entity.defined = scope[entity_]
		}

		return scope[entity_]
	}

	finalizeAssignment(scope,entity){
		if(this.stringLiteral(entity)) entity = this.cutSides(entity)
		let defined
		if(scope[entity]) defined = scope[entity]
		else defined = this.entityDefined(scope,entity)
		if(defined)defined.__data__.inProcess=false
		return defined
	}

	inAssignmentProcess(entity_scope,entity){
		let _scope=entity_scope
		if(_scope.__data__.inProcess&&_scope.__data__.entity==entity) return true
		while(true){
			_scope=_scope.__data__.parentScope
			if(!_scope)break
			if(_scope[entity]&&_scope[entity].__data__&&_scope[entity].__data__.inProcess&&_scope[entity].__data__.entity==entity) return true			
		}

		return this.record().entities&&this.record().entities.includes(entity)
	}	

	implementScope(scope,entity,entity_scope,implement=null){
		let _scope = entity? scope[entity]:scope, n
		let not_implement = ['type','parentScope','entity']
		if(_scope) {
			let data = Object.assign({},_scope.__data__)			
			for(let i in data) if(!not_implement.includes(i)) entity_scope.__data__[i] = data[i]
			_scope = entity_scope
		}
		if(entity) scope[entity] = entity_scope
		else return entity_scope
	}

	standartizeString(str,assoc){
		let ini_str=str
		if(str[0]=="'") str = str.replace(/\\'/g,"'")
		else if(str[0]=='"') str = str.replace(/\\"/g,'"')
		str = str.substring(1,str.length-1)
		str = str.replace(/[^\\]\`/g, e=> e[0]+'\\'+e[1] )
		str = '`'+str+'`'
		assoc[ini_str] = str
		return [str,assoc]
	}
	cutSides(str){
		return str.substring(1,str.length-1)
	}
	definesEntityObj(entity_obj){
		let _=this,i,from=entity_obj.entity_index
		for(i=from;i>=0;i--){
			if((_.writes[i].line_first_entity && _.writes[i].tab<=_.writes[i].prev_line_tab
				||_.writes[i].scope_start)) {
				return _.writes[i]
			}
		}
		return _.writes[0]
	}
	rightVariableName(name){
		return name.match(/^[a-zA-Z_\$][0-9a-zA-Z_\$]*/)[0]==name
	}
	temporaryReplaceRegexes(entity,forth=true,ss2=[]){
		let m,s,r
		if(forth){
			m=entity.match(/\/.*[^\\]\/[^ \)\,]?/g)
			if(m){
				for(let s in m){
					r = '$\\\\'+s
					entity = entity.replace(m[s],r)
					ss2.push(m[s])
				}
			}
		}else{
			m = entity.match(/\$\\\\(\d)/)
			if(m) entity = entity.replace('$\\\\'+m[1],ss2[m[1]])
		}
		return [entity,ss2]
	}
	chaining(entity_obj,scope,as_value=false,contine=false){
		let _=this
		let initial_scope=scope, entity = entity_obj.entity,ss,ss2,parts,parent='',isFunction=_.func_decl_level,converted='',chain_def, initial_assignment
		let parent_scope, recent_parent, parent_defined, define_rest, defines_entity_obj, object_scope, prev_descendant_defined, prev_descendant_part_of_js
		let hasIfElse = has_if_else(scope), imported_object, descendant_type, descendant_defined, last, last_defined
		if(entity_obj.colon_count==1||entity_obj.dots_count==2||entity_obj.colon_count==2) chain_def = 'var_assignment'
		else if(entity_obj.dots_count==1) chain_def = 'func_call'
		else if(entity!='this'&&(entity_obj.dots_count || contine || !entity_obj.line_last_entity&&entity_obj.next_is!='value'&&!entity_obj.next_entity_operator&&entity_obj.next_entity!=')'&&entity_obj.recent_action[0]!='func_call'&&entity_obj.next_entity.substring(0,2)!='..'&&entity_obj.next_entity.substring(0,1)!='.')) {
			chain_def='maybe_func_call'
		}
		;[entity,ss] = _.temporaryReplaceStrings(entity)
		;[entity,ss2] = _.temporaryReplaceRegexes(entity)

		parts = entity.split('.')
		entity_obj.start_chaining_scope = scope
		if(ss[0]) {
			for(let i in parts){
				parts[i] = _.temporaryReplaceStrings(parts[i],false,ss)
			}
		}
		if(ss2[0]) {
			for(let i in parts){
				parts[i] = _.temporaryReplaceRegexes(parts[i],false,ss2)
			}
		}		
		entity = entity_obj.entity
		function has_if_else(scope){
			let _scope=scope
			while(true){
				if(['if','else'].includes(_scope.__data__.type)||_scope.__data__.maybe) return true
				if(!(_scope = _scope.__data__.parentScope)) return false
			}
		}
		function work_chain(parent,descendant,index,converted){
			let parent_defined,
				parent_defined_recently,
				parent_descendant_defined,
				parent_def,
				literal_type,				
				parent_type,
				as_argument,
				force_assign,
				parent_defined_out=false,
				right_var_name=false,
				part_of_js=false
			descendant_type = null
			let _parts = parent.split('.')
			parent = _parts[_parts.length-1]
			if(parent[0]=='[') parent = _.cutSides(parent)
			if(parent[0]!='`') {
				parent_defined = _.entityDefined(initial_scope,parent,true)
				if(!index&&parent_defined&&parent!='this') scope = initial_scope
				if(parent_defined) {
					if(parent_defined.__data__.import){
						imported_object=parent_defined
					}
					parent_defined_out = true
				}
			} else parent = _.cutSides(parent)
			if(index){
				if(parent_defined) {			
					parent = `[${parent}]`
					define_rest = true								
				}else{
					parent_defined = scope[parent]
				}
			}

			if(parent_defined) {
				parent_type = parent_defined.__data__.type
				if(parent_type=='object') object_scope=true
			}			

			if(!parent_defined && /*as_value &&*/ !index && isFunction) as_argument=true
			if(!parent_defined && !index){
				entity_obj.initial_assignment = true
			}
			
			if(descendant[0]=='0'&&descendant.length>1) {
				if(parent_defined && parent_type!='array') _.error(3,parent)
				else parent_type='array'
				descendant = descendant.substring(1)
			}
			literal_type = _.literal(descendant)
			if(!literal_type) {
				
				descendant_defined = _.entityDefined(initial_scope,descendant,'window')

				if(!descendant_defined) {
					let _parent = parent[0]!='['&&!isNaN(parseInt(parent))?`[${parent}]`:(parent[0]!='['?'.':'')+`${parent}`
					
					if(parent_defined&&eval( `try{window${_parent} && typeof window${_parent}${!isNaN(parseInt(descendant))?`[${descendant}]`:`.${descendant}`}=='function'}catch(err){}`) || typeof [parent][descendant]=='function' || ['function','object'].includes(parent_type) && typeof (function(){})[descendant]=='function' || typeof String('')[descendant]=='function' || typeof document.body[descendant]=='function'){					
						descendant_type='function'
						descendant_defined = {}
						part_of_js=true
						_.createScopeTemplate(descendant_defined,parent_defined,descendant_type)				
					} else if(typeof Object[descendant]=='object'){
						descendant_type='object'
						descendant_defined = {}
						part_of_js=true
						_.createScopeTemplate(descendant_defined,parent_defined,descendant_type)
					} else if(typeof ([])[descendant]=='number'){
						descendant_type='number'
						descendant_defined = {}
						part_of_js=true
						_.createScopeTemplate(descendant_defined,parent_defined,descendant_type)
					} else if(typeof _.simple_node[descendant]!='undefined'){
						descendant_type=typeof _.simple_node[descendant]
						descendant_defined = {}
						part_of_js=true					
					} else { 

						if((!['object','function'].includes(parent_type) || !parent_defined) && parent!='this' && !prev_descendant_defined && !as_argument) {
							force_assign=true
						}
						if(_.rightVariableName(descendant)) {							
							right_var_name=true
						}
						else descendant = '`'+descendant+'`'
					}
				} else  {
					descendant_type = descendant_defined.__data__.type
					if( descendant_type == 'integer' || parent_type=='array' ) parent_type='array'
					else if(!['function','object','array'].includes(descendant_type)) {
					}
				}
			} else {
				if((!['object','function'].includes(parent_type) || !parent_defined) && parent!='this' && !prev_descendant_defined && !as_argument) {
					force_assign=true
				}			
				if(literal_type=='integer') {
					parent_type='array'
				}
				else if(['T','F','N'].includes(descendant)) {
					parent_type='object'
					if(literal_type=='boolean') descendant=descendant=='T'?"`true`":"`false`"
					else descendant="`null`"
				}
				else if(literal_type=='undefined') _.error(4,descendant) 					
			}

			if(!parent_type) parent_type='object'
			 
			parent_scope = scope
			if(parent_defined){
				scope = parent_defined
			}


			if(!parent_defined || define_rest || force_assign){
				if(!parent_defined || parent_defined.__data__.type!=parent_type || parent_defined.__data__.maybe || define_rest){
					if(!parent_defined) {
						parent_defined_recently = parent_defined = _.defineEntity(scope,parent,parent_type,index,as_argument,false,true)
						scope = parent_defined
						parent_scope = parent_defined.__data__.parentScope						
					}
					if(!parent_scope.__data__.childScopes) {
						_.createScopeTemplate(parent_scope,parent_scope.__data__.parentScope,parent_scope.__data__.type,true)						
					}

					if(!parent_defined_out) {
						scope = _.getScope(parent_scope)
						_.createScopeTemplate(scope,parent_scope,parent_type)
						parent_scope[parent] = scope
						_.implementScope(parent_scope,parent,scope)
					}
					if((parent_defined_out)&&index>0) {
						parent_defined.__data__.maybe=true
						delete scope[parent]
					}
					if(parent_type=='object') object_scope=true						
					if(object_scope) scope.__data__.objectScope = true
					if(!parent_defined || index) define_rest = true
				}else{
					scope = parent_defined
				}
				if(index && chain_def=='var_assignment' && (define_rest && parent!='this' && (!prev_descendant_defined||prev_descendant_part_of_js) && !imported_object || force_assign && (!parent_defined || parent_defined_recently) ) ){										
					defines_entity_obj = _.definesEntityObj(entity_obj)		
					if(!defines_entity_obj.define) defines_entity_obj.define=[]
					defines_entity_obj.define.push([converted,_.assoc[parent_type],index])
				}
			}
			if(!descendant_defined&&parent_defined&&index==parts.length-2){
				descendant_defined = scope[_.stringLiteral(descendant)?_.cutSides(descendant):descendant]
				if(descendant_defined) {
					scope = descendant_defined
					descendant_type = scope.__data__.type
				}
			}
			if(literal_type!='string' && ((['object','function','number','string'].includes(descendant_type) || right_var_name&&parent_type!='array') || part_of_js || parent_defined && parent_defined.__data__ && descendant_defined && descendant_defined.__data__ && parent_defined.__data__.id==descendant_defined.__data__.parentScope.__data__.id)) {
				descendant = `.${descendant}`
			} else descendant = `[${descendant}]`
			converted+=descendant
			prev_descendant_defined = descendant_defined
			prev_descendant_part_of_js = part_of_js
			if(!descendant_defined) descendant_type=null
			return [descendant,converted]
		}
		function continue_chain(entity){
			let entity_defined, entity_type, literal_type			
			if(entity[0]=='0'&&entity.length>1) {
				entity = entity.substring(1)
				entity_type = 'integer'
			}
			entity_defined = _.entityDefined(scope,entity,'window')
			if(entity_defined&&parts[0]!='this'&&entity_defined.__data__.parentScope.__data__.entity=='this') entity_defined=null
			if(entity_defined) {
				if(entity_type && ![null,'integer','string'].includes(entity_defined.__data__.type)) _.error(8,entity)
				entity_type = entity_defined.__data__.type
			}
			literal_type = _.literal(entity)
			if((entity_defined&&entity_type!='function') || ['string','integer'].includes(literal_type) || entity_type == 'integer' || ['T','F','N'].includes(entity)) {
				converted+=`[${entity}]`
				if(chain_def!='var_assignment')chain_def=''
			}
			else converted+=`.${entity}`
		}
		if(!contine){			
			converted = parent = parts[0]
			for(let i=0;i<parts.length-1;i++){
				if(parts[i+1]){
					;[parts[i+1],converted] = work_chain(parent,parts[i+1],i,converted)
					if(parts[i+1][0]!='.')parent+='.'
					parent+=parts[i+1]
					if(descendant_type=='object'&&chain_def!='var_assignment') chain_def=''					
					if(i==parts.length-2&&chain_def=='var_assignment') {
						parts = parent.split('.')
						last = parts[parts.length-1]
						if(last[0]=='[') last = _.cutSides(last)
						if(_.stringLiteral(last)) last = _.cutSides(last)
						last_defined = _.entityDefined(scope,last,parts[0])
						if(!last_defined){
							if(_.stringLiteral(last[0])) last = _.cutSides(last)					
							if(descendant_defined) last = `[${last}]`														
							if(!scope[last]){
								let _scope = {}
								_.createScopeTemplate(_scope,scope.__data__.lastScope,scope.__data__.type)
								_.implementScope(scope,last,_scope)	
								scope = _.defineEntity(scope,last,null,!i,false,false,true)
								scope.__data__.objectScope = true
							} else scope = scope[last]
						} else scope = last_defined
						entity_obj.defined = scope
					} else if(i==parts.length-2) {
						if(descendant_type=='function') chain_def='func_call'
						else if(!descendant_type&&!descendant_defined) {
							parts = parent.split('.')
							last = parts[parts.length-1]
							let _scope = {}
							_scope={}
							_.createScopeTemplate(_scope,scope.__data__.lastScope)
							_.implementScope(scope,last,)	
							scope = _scope
							if(entity_obj.dots_count||entity_obj.next_entity&&!entity_obj.next_entity_operator&&!entity_obj.next_entity_special&&entity_obj.next_entity[0]!='.')chain_def='func_call'					
						} else chain_def=''
					}
				} else {
					break
				}
			}
		} else {
			for(let i=0;i<parts.length;i++){
				continue_chain(parts[i])
			}	
		}
		entity_obj.converted=converted
		if(chain_def=='maybe_func_call'&&scope.__data__.type==null&&!contine)chain_def=''
		if(scope && scope.__data__.type=='function'&& chain_def!='var_assignment'&&!entity_obj.func_decl&&!descendant_defined) {
			chain_def='func_call'
		}
		if(['func_call','maybe_func_call'].includes(chain_def)&&entity_obj.has_end_backslash) chain_def=''
		if(chain_def) entity_obj.start[chain_def] = true
		if(parts[0]!='this'&&entity_obj.initial_assignment&&chain_def=='func_call'&&!descendant_defined) _.error(10,entity)
		if(chain_def!='func_call'&&!contine) entity_obj.defined = scope
		entity_obj.chain_def=chain_def
		scope = initial_scope		 
		return entity
	}

	showStacks(only_actions=false){
		let _=this,stack=[]
		for(let v of _.actions_stack) stack.push(v.slice(0,6))
	}

	removeLastSymbols(entity,symbol){
		let count=0
		while(true){
			if(entity[entity.length-1] != symbol) break
			entity = entity.substring(0,entity.length-1)
			count++
		}
		return entity
	}

	removeFirstSymbols(entity,symbol){
		let count=0
		while(true){
			if(entity[0] != symbol) break
			entity = entity.substring(1)
			count++
		}
		return entity
	}	

	stringLiteral(entity){
		let r=false
		for(let s of ['"',"'",'`']){
			if(entity[0]==s&&entity[entity.length-1]==s){
				r=true
				break
			}
		}
		return r
	}	

	typeOfEntity(entity){
		let _=this,thisType=null
		for(let type in _.entities){
			if(_.entities[type].includes(entity)) thisType = type
		}
		if(thisType&&!['special','brackets'].includes(thisType)) thisType = 'operator'
		return thisType
	}

	isUnassignable(entity){
		if(this.reserved.includes(entity)) return 'reserved'
		try {
			eval('var '+entity)
		} catch {
			return 'other'
		}
		return false
	}

	type(entity_obj,remove_dots=false){
		let _=this, entity=entity_obj.entity,set_cache=true
		let concrete, r
		if(entity_obj.dots_count_before==3) {
			return {type:'literal',concrete:'spread'}
		}
		if(remove_dots){
			entity = _.removeLastSymbols(entity,'.')
			entity = _.removeFirstSymbols(entity,'.')
		}
		if(_.types[entity]) return _.types[entity]
				
		if(concrete=_.literal(entity)) {
			if(entity=='..'){
				set_cache=false
				if(entity_obj.line_first_entity&&entity_obj.line_last_entity) {				
					r={type:'unassignable',concrete:'continue'}
				} else r={type:'literal',concrete}
			} else r={type:'literal',concrete}	
		}
		else if(['_','this'].includes(entity)) r={type:'this'}
		else if(!_.dotContains.includes(entity)&&entity.includes('.')) r={type:'chain',concrete:null}		 
		else if(concrete=_.typeOfEntity(entity)) r={type:'entity',concrete}
		else if(concrete = _.isUnassignable(entity)) r={type:'unassignable',concrete}
		else r={type:'assignable',concrete:null}
		if(set_cache) _.types[entity] = r
		return r
	}
	replaceArguments(str){
		for(let i in arguments) str = str.replace('$'+i,arguments[i])
		return str
	}
	error(n){
		if(this.skip_aya_errors) return
		let error=this.errors[n], args = Array.from(arguments)
		error = this.replaceArguments(error,...(args.slice(1)))
		if(this.test) console.error(error)
		else console.log(`%c${error}`,'color:#FF5D32;')
		throw error
	}

	errorType(n,l){
		if(this.skip_aya_errors) return
		let errorType=this.errorTypes[n]
		console.log(`%c${errorType}%c [on line ${l+1}]`,'color:yellow;font-style:italic;','color:#A0A000;font-style:italic;')
		this.terminated=true	
	}
	lineSubstringByIndex(struct,line,index){
		let _=this, before='', part, last, after='', i=0, pf=0, f=0
		for(let e of struct){			
			pf = f
			f = line.indexOf(e, pf)
			f+=e.length
			part = line.substring(pf,f)	
			if(i==index+1) {
				last = part
				after = line.substring(f)
				break
			}
			before += part
			i++
		}
		return [before,last,after]
	}
	showTerminatedInput(index,line_index){
		let _=this
		let input='', i, li=line_index||_.line_index, part, last, before
		for(i=0;i<li;i++) input+=`${i+1}· ${_.currentLines[i]}\n`
		input+=`${li+1}· `
		;[before,last] = _.lineSubstringByIndex(_.currentStruct[li][1],_.currentLines[li],index)
		input+=before
		console.log(`%c${input}%c${last}`,'background:#FEF3D8;color:#999;','background:#FEF3D8;color:red;font-weight:bold;text-decoration:underline;')
	}
	debugAya(data,line_index){
		let _=this, eo=data.entity_obj
		let msg = _.replaceArguments(_.debug_aya_assoc[data.name], ...[eo.converted||eo.entity])
		eo.debugged=true
		save_log('debug-aya',`${msg} %c[on line ${line_index}]`,'color:#777;font-weight:bold;','font-style:italic;color:#555;')
	}

}
window.onload = () => { if(!window.AYA_dontRun) window.AYA = new Aya()}