const React = require('react');
const { View } = require('react-native');

const MapView = (props) => React.createElement(View, props);
MapView.Animated = MapView;

const Marker = (props) => React.createElement(View, props);
const Polyline = (props) => React.createElement(View, props);
const Polygon = (props) => React.createElement(View, props);
const Circle = (props) => React.createElement(View, props);
const Callout = (props) => React.createElement(View, props);
const UrlTile = (props) => React.createElement(View, props);

module.exports = {
  __esModule: true,
  default: MapView,
  MapView,
  Marker,
  Polyline,
  Polygon,
  Circle,
  Callout,
  UrlTile,
  PROVIDER_GOOGLE: 'google',
  PROVIDER_DEFAULT: null,
};
