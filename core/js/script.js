Wee.fn.make('sort', {
	init: function() {
		this.$private.init();
	}
}, {
	_construct: function(conf) {
		this.conf = $.extend({
			sel: 'ref:weeSort',
			appSel: 'ref:weeSortApp'
		}, conf);

		this.$table = $(this.conf.sel);
		this.data = {
			headings: [],
			rows: []
		};
	},

	init: function() {
		this.processData();
		this.createElements();
		this.initApp();
		this.bindEvents();
	},

	createElements: function() {
		var appSel = this.conf.appSel.split(':');

		appSel = (appSel.length > 0) ? appSel[1] : appSel[0];

		this.$table.hide();
		this.$table.before('<div data-ref="' + appSel + '" class="wee-sort-app" />');
	},

	processData: function() {
		var scope = this,
			headings = this.$table.find('th'),
			rows = this.$table.find('tr'),
			headingsLength = headings.length,
			rowsLength = rows.length,
			columns = [],
			r = 0,
			h = 0;

		for (; h < headingsLength; h++) {
			this.data.headings.push({
				heading: headings[h].innerText,
				type: headings[h].dataset.type
			});
		}

		for (; r < rowsLength; r++) {
			var childrenLength = rows[r].children.length,
				c = 0;

			for (; c < childrenLength; c++) {
				columns.push({
					key: headings[c].innerText,
					value: rows[r].children[c].innerText,
					sortValue: this.getSortValue(rows[r].children[c].innerText, headings[c].dataset.type),
					type: headings[c].dataset.type,
					originalIndex: r
				});
			}

			this.data.rows.push({
				hidden: false,
				columns: columns
			});

			columns = [];
		}

		scope.data.rows.shift();
	},

	initApp: function() {
		this.app = $.app.make('weeSort', {
			target: 'ref:weeSortApp',
			view: 'sort.sort',
			model: this.data
		});
	},

	bindEvents: function() {
		var scope = this,
			throttle;

		$.events.on({
			'ref:sort': {
				click: function(e, el) {
					var data = el.dataset;
					
					scope.sort(data.key, data.direction);
				}
			},
			'ref:reset': {
				click: function() {
					scope.reset();
				}
			},
			'ref:filterValue': {
				keyup: function(e, el) {
					// scope.filter(el.value);
					// TODO: Throttling the event makes it seem like it's slower, figure out if we need it
					$._win.clearTimeout(throttle);

					throttle = $._win.setTimeout(function() {
						scope.filter(el.value);
					}, 10);
				}
			},
			'ref:filterKey': {
				change: function(e, el) {
					if (scope.filterVal) {
						scope.filter(scope.filterVal);
					}
				}
			}
		});
	},

	filter: function(value) {
		console.time('filter');
		var rows = this.data.rows,
			key = key = $('ref:filterKey').val(),
			regExp = new RegExp(this.fuzzyValue(value), 'i'),
			rowsLength = rows.length,
			i = 0;

		for (; i < rowsLength; i++) {
			var columnsLength = rows[i].columns.length,
				c = 0;

			rows[i].hidden = true;

			for (; c < columnsLength; c++) {
				var col = rows[i].columns[c];

				if (col.key === key && regExp.test(col.value)) {
					rows[i].hidden = false;
				}
			}
		}

		this.filterVal = value;
		this.setData('rows', rows);
		console.timeEnd('filter');
	},

	sort: function(key, direction) {
		var scope = this,
			rows = scope.data.rows;

		if (this.sortedKey === key && this.sortedDirection === direction) {
			return;
		}

		rows.sort(function(a, b) {
			var colLength = a.columns.length,
				i = 0;

			for (; i < colLength; i++) {
				var valA = a.columns[i].sortValue,
					valB = b.columns[i].sortValue;

				if (a.columns[i].key == key) {
					if (a.columns[i].type === 'integer') {
						if (direction === 'asc') {
							return valA - valB;
						}

						return valB - valA;
					} else {
						if (valA > valB) {
							if (direction === 'asc') {
								return 1;
							}

							return -1;
						}

						if (valA < valB) {
							if (direction === 'asc') {
								return -1;
							}

							return 1;
						}
					}

					return 0;
				};
			}
		});

		this.sortedKey = key;
		this.sortedDirection = direction;

		this.setData('rows', rows);
	},

	reset: function() {
		var rows = this.data.rows;
		
		rows.sort(function(a, b) {
			var colLength = a.columns.length,
				i = 0;

			for (; i < colLength; i++) {
				var indexA = a.columns[i].originalIndex,
					indexB = b.columns[i].originalIndex;

				if (indexA > indexB) {
					return 1;
				} else if (indexA < indexB) {
					return -1;
				}

				return 0;
			}
		});

		this.sortedKey = false;
		this.sortedDirection = false;

		this.setData('rows', rows);
	},

	getSortValue: function(value, type) {
		switch (type) {
			case 'date':
				return this.getDate(value);
			default:
				return value;
		}
	},

	fuzzyValue: function(value) {
		var letters = value.split(''),
			lettersLength = letters.length,
			searchTerm = '',
			i = 0;

		for (; i < lettersLength; i++) {
			searchTerm += letters[i] + '.*';
		}

		return searchTerm;
	},

	getDate: function(value) {
		var date = value.replace(/(?:st|nd|rd|th)/g, '');

		return Date.parse(date);
	},

	setData: function(key, value) {
		this.app.$set(key, value);
		this.app.$resume(true);
	}
}, {
	instance: false
});