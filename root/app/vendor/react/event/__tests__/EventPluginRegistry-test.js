/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @emails react-core
 */

"use strict";

var merge = require("../../merge");

describe('EventPluginRegistry', function() {
  var EventPluginRegistry;
  var createPlugin;

  beforeEach(function() {
    EventPluginRegistry = require("../../EventPluginRegistry");
    EventPluginRegistry._resetEventPlugins();

    createPlugin = function(properties) {
      return merge({extractEvents: function() {}}, properties);
    };
  });

  it('should be able to inject ordering before plugins', function() {
    var OnePlugin = createPlugin();
    var TwoPlugin = createPlugin();
    var ThreePlugin = createPlugin();

    EventPluginRegistry.injectEventPluginOrder(['one', 'two', 'three']);
    EventPluginRegistry.injectEventPluginsByName({
      one: OnePlugin,
      two: TwoPlugin
    });
    EventPluginRegistry.injectEventPluginsByName({
      three: ThreePlugin
    });

    expect(EventPluginRegistry.plugins.length).toBe(3);
    expect(EventPluginRegistry.plugins[0]).toBe(OnePlugin);
    expect(EventPluginRegistry.plugins[1]).toBe(TwoPlugin);
    expect(EventPluginRegistry.plugins[2]).toBe(ThreePlugin);
  });

  it('should be able to inject plugins before and after ordering', function() {
    var OnePlugin = createPlugin();
    var TwoPlugin = createPlugin();
    var ThreePlugin = createPlugin();

    EventPluginRegistry.injectEventPluginsByName({
      one: OnePlugin,
      two: TwoPlugin
    });
    EventPluginRegistry.injectEventPluginOrder(['one', 'two', 'three']);
    EventPluginRegistry.injectEventPluginsByName({
      three: ThreePlugin
    });

    expect(EventPluginRegistry.plugins.length).toBe(3);
    expect(EventPluginRegistry.plugins[0]).toBe(OnePlugin);
    expect(EventPluginRegistry.plugins[1]).toBe(TwoPlugin);
    expect(EventPluginRegistry.plugins[2]).toBe(ThreePlugin);
  });

  it('should be able to inject repeated plugins and out-of-order', function() {
    var OnePlugin = createPlugin();
    var TwoPlugin = createPlugin();
    var ThreePlugin = createPlugin();

    EventPluginRegistry.injectEventPluginsByName({
      one: OnePlugin,
      three: ThreePlugin
    });
    EventPluginRegistry.injectEventPluginOrder(['one', 'two', 'three']);
    EventPluginRegistry.injectEventPluginsByName({
      two: TwoPlugin,
      three: ThreePlugin
    });

    expect(EventPluginRegistry.plugins.length).toBe(3);
    expect(EventPluginRegistry.plugins[0]).toBe(OnePlugin);
    expect(EventPluginRegistry.plugins[1]).toBe(TwoPlugin);
    expect(EventPluginRegistry.plugins[2]).toBe(ThreePlugin);
  });

  it('should throw if plugin does not implement `extractEvents`', function() {
    var BadPlugin = {};

    EventPluginRegistry.injectEventPluginOrder(['bad']);

    expect(function() {
      EventPluginRegistry.injectEventPluginsByName({
        bad: BadPlugin
      });
    }).toThrow(
      'Invariant Violation: EventPluginRegistry: Event plugins must ' +
      'implement an `extractEvents` method, but `bad` does not.'
    );
  });

  it('should throw if plugin does not exist in ordering', function() {
    var OnePlugin = createPlugin();
    var RandomPlugin = createPlugin();

    EventPluginRegistry.injectEventPluginOrder(['one']);

    expect(function() {
      EventPluginRegistry.injectEventPluginsByName({
        one: OnePlugin,
        random: RandomPlugin
      });
    }).toThrow(
      'Invariant Violation: EventPluginRegistry: Cannot inject event plugins ' +
      'that do not exist in the plugin ordering, `random`.'
    );
  });

  it('should throw if ordering is injected more than once', function() {
    var pluginOrdering = [];

    EventPluginRegistry.injectEventPluginOrder(pluginOrdering);

    expect(function() {
      EventPluginRegistry.injectEventPluginOrder(pluginOrdering);
    }).toThrow(
      'Invariant Violation: EventPluginRegistry: Cannot inject event plugin ' +
      'ordering more than once.'
    );
  });

  it('should throw if different plugins injected using same name', function() {
    var OnePlugin = createPlugin();
    var TwoPlugin = createPlugin();

    EventPluginRegistry.injectEventPluginsByName({same: OnePlugin});

    expect(function() {
      EventPluginRegistry.injectEventPluginsByName({same: TwoPlugin});
    }).toThrow(
      'Invariant Violation: EventPluginRegistry: Cannot inject two different ' +
      'event plugins using the same name, `same`.'
    );
  });

  it('should publish registration names of injected plugins', function() {
    var OnePlugin = createPlugin({
      eventTypes: {
        click: {registrationName: 'onClick'},
        focus: {registrationName: 'onFocus'}
      }
    });
    var TwoPlugin = createPlugin({
      eventTypes: {
        magic: {
          phasedRegistrationNames: {
            bubbled: 'onMagicBubble',
            captured: 'onMagicCapture'
          }
        }
      }
    });

    EventPluginRegistry.injectEventPluginsByName({one: OnePlugin});
    EventPluginRegistry.injectEventPluginOrder(['one', 'two']);

    expect(EventPluginRegistry.registrationNamesKeys.length).toBe(2);
    expect(EventPluginRegistry.registrationNames.onClick).toBe(OnePlugin);
    expect(EventPluginRegistry.registrationNames.onFocus).toBe(OnePlugin);

    EventPluginRegistry.injectEventPluginsByName({two: TwoPlugin});

    expect(EventPluginRegistry.registrationNamesKeys.length).toBe(4);
    expect(EventPluginRegistry.registrationNames.onMagicBubble).toBe(TwoPlugin);
    expect(
      EventPluginRegistry.registrationNames.onMagicCapture
    ).toBe(TwoPlugin);
  });

  it('should throw if multiple registration names collide', function() {
    var OnePlugin = createPlugin({
      eventTypes: {
        photoCapture: {registrationName: 'onPhotoCapture'}
      }
    });
    var TwoPlugin = createPlugin({
      eventTypes: {
        photo: {
          phasedRegistrationNames: {
            bubbled: 'onPhotoBubble',
            captured: 'onPhotoCapture'
          }
        }
      }
    });

    EventPluginRegistry.injectEventPluginsByName({
      one: OnePlugin,
      two: TwoPlugin
    });

    expect(function() {
      EventPluginRegistry.injectEventPluginOrder(['one', 'two']);
    }).toThrow(
      'Invariant Violation: EventPluginHub: More than one plugin attempted ' +
      'to publish the same registration name, `onPhotoCapture`.'
    );
  });

  it('should throw if an invalid event is published', function() {
    var OnePlugin = createPlugin({
      eventTypes: {
        badEvent: {/* missing configuration */}
      }
    });

    EventPluginRegistry.injectEventPluginsByName({one: OnePlugin});

    expect(function() {
      EventPluginRegistry.injectEventPluginOrder(['one']);
    }).toThrow(
      'Invariant Violation: EventPluginRegistry: Failed to publish event ' +
      '`badEvent` for plugin `one`.'
    );
  });

  it('should be able to get the plugin from synthetic events', function() {
    var clickDispatchConfig = {
      registrationName: 'onClick'
    };
    var magicDispatchConfig = {
      phasedRegistrationNames: {
        bubbled: 'onMagicBubble',
        captured: 'onMagicCapture'
      }
    };

    var OnePlugin = createPlugin({
      eventTypes: {
        click: clickDispatchConfig,
        magic: magicDispatchConfig
      }
    });

    var clickEvent = {dispatchConfig: clickDispatchConfig};
    var magicEvent = {dispatchConfig: magicDispatchConfig};

    expect(EventPluginRegistry.getPluginModuleForEvent(clickEvent)).toBe(null);
    expect(EventPluginRegistry.getPluginModuleForEvent(magicEvent)).toBe(null);

    EventPluginRegistry.injectEventPluginsByName({one: OnePlugin});
    EventPluginRegistry.injectEventPluginOrder(['one']);

    expect(
      EventPluginRegistry.getPluginModuleForEvent(clickEvent)
    ).toBe(OnePlugin);
    expect(
      EventPluginRegistry.getPluginModuleForEvent(magicEvent)
    ).toBe(OnePlugin);
  });

});

require("../../mock-modules").register("event/__tests__/EventPluginRegistry-test", module);
