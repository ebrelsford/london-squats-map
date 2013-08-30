(function (window, $, undefined) {
    "use strict";

    $.freespacemap = function (options, element) {
        this.element = $(element);
        if (!this._create(options)) {
            this.failed = true;
        }
    };

    $.freespacemap.defaults = {
        center: [51.4916, -0.1469],
        leafletApiKey: '781b27aa166a49e1a398cd9b38a81cdf',
        leafletStyleId: '9986',
        zoom: 10,
    };

    $.freespacemap.prototype = {

        map: null,

        style: {
            fillColor: '#000',
            fillOpacity: 1,
            radius: 4,
            color: '#FFF',
            opacity: 1
        },

        _create: function (options) {
            // Add custom options to defaults
            var opts = $.extend(true, {}, $.freespacemap.defaults, options);
            this.options = opts;
            var $window = $(window);
            var instance = this;

            instance._initializeMap();

            return true;
        },

        _initializeMap: function () {
            var instance = this;

            instance.map = L.map('map', {
                center: instance.options.center,
                zoom: instance.options.zoom
            });

            // add tile layer
            L.tileLayer('http://{s}.tile.cloudmade.com/' 
                    + instance.options.leafletApiKey +'/' + instance.options.leafletStyleId
                    + '/256/{z}/{x}/{y}.png', {
                attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery &copy; <a href="http://cloudmade.com">CloudMade</a>',
                maxZoom: 18,
            }).addTo(instance.map);

            $.getJSON('http://newagebeverages.cartodb.com/api/v2/sql?format=GeoJSON&q=SELECT * FROM evicted_squats_london', function (data) {
                L.geoJson(data, {

                    onEachFeature: function (featureData, layer) {
                        layer.on('click', function (e) {
                            // precompile
                            var source = $('#popup-template').html();
                            var template = Handlebars.compile(source);
                            var content = template({
                                place: featureData
                            });
                            layer.bindPopup(content, {
                                minWidth: 300,
                                maxHeight: 450
                            }).openPopup();
                        });
                    },

                    pointToLayer: function (feature, latlng) {
                        return L.circleMarker(latlng, instance.style);
                    },

                }).addTo(instance.map);

                var sortedFeatures = _.sortBy(data.features, function (f) {
                    return f.properties.name_of_space;
                });

                var source = $('#list-template').html();
                var template = Handlebars.compile(source);
                $('#list').html(template({
                    places: sortedFeatures,
                }));

                $('.list-place a').click(function (e) {
                    e.preventDefault();
                    var clicked_id = $(this).data('cartodbid');
                    var clicked_layer = _.find(instance.map._layers, function (layer) {
                        if (!layer.feature) return false;
                        return layer.feature.properties.cartodb_id === clicked_id;
                    });

                    clicked_layer.fire('click');
                    return false;
                });
            });

        },

    };

    $.fn.freespacemap = function (options) {
        var thisCall = typeof options;

        switch (thisCall) {

        // method 
        case 'string':
            var args = Array.prototype.slice.call(arguments, 1);
            var instance = $.data(this[0], 'freespacemap');

            if (!instance) {
                // not setup yet
                return $.error('Method ' + options +
                    ' cannot be called until freespacemap is setup');
            }

            if (!$.isFunction(instance[options]) || options.charAt(0) === "_") {
                return $.error('No such method ' + options + ' for freespacemap');
            }

            // no errors!
            return instance[options].apply(instance, args);
            break;

            // creation 
        case 'object':

            this.each(function () {
                var instance = $.data(this, 'freespacemap');

                if (instance) {
                    // update options of current instance
                    instance.update(options);
                } else {
                    // initialize new instance
                    instance = new $.freespacemap(options, this);

                    // don't attach if instantiation failed
                    if (!instance.failed) {
                        $.data(this, 'freespacemap', instance);
                    }
                }
            });

            break;
        }

        return this;
    };

})(window, jQuery);

$(document).ready(function () {
    $('#map').freespacemap({});
});
