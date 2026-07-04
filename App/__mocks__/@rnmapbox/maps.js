const React = require('react');
const { View } = require('react-native');

const MapView = (props) => React.createElement(View, props);
const Camera = (props) => React.createElement(View, props);
const ShapeSource = (props) => React.createElement(View, props);
const LineLayer = (props) => React.createElement(View, props);
const SymbolLayer = (props) => React.createElement(View, props);
const CircleLayer = (props) => React.createElement(View, props);
const FillLayer = (props) => React.createElement(View, props);
const PointAnnotation = (props) => React.createElement(View, props);
const MarkerView = (props) => React.createElement(View, props);
const UserLocation = (props) => React.createElement(View, props);

module.exports = {
  __esModule: true,
  default: { MapView, Camera, setAccessToken: jest.fn(), setTelemetryEnabled: jest.fn() },
  MapView,
  Camera,
  ShapeSource,
  LineLayer,
  SymbolLayer,
  CircleLayer,
  FillLayer,
  PointAnnotation,
  MarkerView,
  UserLocation,
  setAccessToken: jest.fn(),
  setTelemetryEnabled: jest.fn(),
};
