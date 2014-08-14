/**
 * @preserve Copyright (c) 2014 British Broadcasting Corporation
 * (http://www.bbc.co.uk) and TAL Contributors (1)
 *
 * (1) TAL Contributors are listed in the AUTHORS file and at
 *     https://github.com/fmtvp/TAL/AUTHORS - please extend this file,
 *     not this notice.
 *
 * @license Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * All rights reserved
 * Please contact us for an alternative licence
 */

(function() {
    this.HTML5MediaPlayerTests = AsyncTestCase("HTML5MediaPlayer");

    var config = {"modules":{"base":"antie/devices/browserdevice","modifiers":["antie/devices/mediaplayer/html5"]}, "input":{"map":{}},"layouts":[{"width":960,"height":540,"module":"fixtures/layouts/default","classes":["browserdevice540p"]}],"deviceConfigurationKey":"devices-html5-1"};

    var stubCreateElementResults = undefined;
    var stubCreateElement = function (sandbox, application) {

        var device = application.getDevice();

        var stubFunc = function(type, id) {
            if (id && stubCreateElementResults[type]) {
                stubCreateElementResults[type].id = id;
            }

            return stubCreateElementResults[type];
        };

        return sandbox.stub(device, "_createElement", stubFunc);
    };

    this.HTML5MediaPlayerTests.prototype.setUp = function() {
        this.sandbox = sinon.sandbox.create();

        // We will use a div to provide fake elements for video and audio elements. This is to get around browser
        // implementations of the media elements preventing you from doing particular things unless a video has been
        // loaded and is in the right state, for example you might receive:
        //      InvalidStateError: Failed to set the 'currentTime' property on 'HTMLMediaElement': The element's readyState is HAVE_NOTHING
        stubCreateElementResults = {
            video: document.createElement("div"),
            audio: document.createElement("div"),
            source: document.createElement("source")
        };
        var mediaElements = [stubCreateElementResults.video, stubCreateElementResults.audio];
        for (var i = 0; i < mediaElements.length; i++) {
            var media = mediaElements[i];
            media.seekable = {
                start: this.sandbox.stub(),
                end: this.sandbox.stub()
            };
            media.play = this.sandbox.stub();
        }
    };

    this.HTML5MediaPlayerTests.prototype.tearDown = function() {
        this.sandbox.restore();

        // Ensure we have a clean DOM
        var elementsToRemove = [ 'mediaPlayerVideo', 'mediaPlayerAudio' ];
        for (var i = 0; i < elementsToRemove.length; i++) {
            var element = document.getElementById(elementsToRemove[i]);
            if (element && element.parentNode) {
                element.parentNode.removeChild(element);
            }
        }

    };

    this.HTML5MediaPlayerTests.prototype.runMediaPlayerTest = function (queue, action) {
        var self = this;
        queuedApplicationInit(queue, 'lib/mockapplication', ["antie/devices/mediaplayer/html5", "antie/devices/mediaplayer/mediaplayer"],
            function(application, MediaPlayerImpl, MediaPlayer) {
                self._createElementStub = stubCreateElement(this.sandbox, application);
                this._device = application.getDevice();
                self._mediaPlayer = this._device.getMediaPlayer();
                action.call(self, MediaPlayer);
            }, config);
    };

    //---------------------
    // HTML5 specific tests
    //---------------------

    this.HTML5MediaPlayerTests.prototype.testVideoElementCreatedWhenSettingSourceWithVideoType = function(queue) {
        expectAsserts(1);
        this.runMediaPlayerTest(queue, function (MediaPlayer) {
            this._mediaPlayer.setSource(MediaPlayer.TYPE.VIDEO, 'testURL', 'video/mp4');

            assert(this._createElementStub.calledWith("video", "mediaPlayerVideo"));
        });
    };

    this.HTML5MediaPlayerTests.prototype.testAudioElementCreatedWhenSettingSourceWithAudioType = function(queue) {
        expectAsserts(1);
        this.runMediaPlayerTest(queue, function (MediaPlayer) {
            this._mediaPlayer.setSource(MediaPlayer.TYPE.AUDIO, 'testURL', 'audio/mp4');

            assert(this._createElementStub.calledWith("audio", "mediaPlayerAudio"));
        });
    };

    this.HTML5MediaPlayerTests.prototype.testCreatedVideoElementIsPutAtBackOfDOM = function(queue) {
        expectAsserts(1);
        this.runMediaPlayerTest(queue, function (MediaPlayer) {
            this._mediaPlayer.setSource(MediaPlayer.TYPE.VIDEO, 'testURL', 'video/mp4');

            var body = document.getElementsByTagName("body")[0];
            assertSame(stubCreateElementResults.video, body.firstChild);
        });
    };

    this.HTML5MediaPlayerTests.prototype.testVideoElementIsRemovedFromDOMOnReset = function(queue) {
        expectAsserts(1);
        this.runMediaPlayerTest(queue, function (MediaPlayer) {
            this._mediaPlayer.setSource(MediaPlayer.TYPE.VIDEO, 'testURL', 'video/mp4');
            this._mediaPlayer.reset();

            var searchResult = document.getElementById('mediaPlayerVideo');

            assertNull(searchResult);
        });
    };

    this.HTML5MediaPlayerTests.prototype.testCreatedAudioElementIsPutAtBackOfDOM = function(queue) {
        expectAsserts(1);
        this.runMediaPlayerTest(queue, function (MediaPlayer) {
            this._mediaPlayer.setSource(MediaPlayer.TYPE.AUDIO, 'testURL', 'audio/mp4');

            var body = document.getElementsByTagName("body")[0];
            assertSame(stubCreateElementResults.audio, body.firstChild);
        });
    };

    this.HTML5MediaPlayerTests.prototype.testAudioElementIsRemovedFromDOMOnReset = function(queue) {
        expectAsserts(1);
        this.runMediaPlayerTest(queue, function (MediaPlayer) {
            this._mediaPlayer.setSource(MediaPlayer.TYPE.AUDIO, 'testURL', 'audio/mp4');
            this._mediaPlayer.reset();

            var searchResult = document.getElementById('mediaPlayerAudio');

            assertNull(searchResult);
        });
    };

    this.HTML5MediaPlayerTests.prototype.testSourceElementAddedToVideoOnSetSources = function(queue) {
        expectAsserts(3);
        this.runMediaPlayerTest(queue, function (MediaPlayer) {
            this._mediaPlayer.setSource(MediaPlayer.TYPE.VIDEO, 'testURL', 'video/mp4');

            assert(this._createElementStub.calledWith("source"));
            assertEquals(1, stubCreateElementResults.video.children.length);
            assertSame(stubCreateElementResults.source, stubCreateElementResults.video.firstChild);
        });
    };

    this.HTML5MediaPlayerTests.prototype.testSourceURLSetOnSetSources = function(queue) {
        expectAsserts(1);
        this.runMediaPlayerTest(queue, function (MediaPlayer) {
            this._mediaPlayer.setSource(MediaPlayer.TYPE.VIDEO, 'http://testurl/', 'video/mp4');

            assertEquals('http://testurl/', stubCreateElementResults.source.src);
        });
    };

    this.HTML5MediaPlayerTests.prototype.testSourceTypeSetOnSetSources = function(queue) {
        expectAsserts(1);
        this.runMediaPlayerTest(queue, function (MediaPlayer) {
            this._mediaPlayer.setSource(MediaPlayer.TYPE.VIDEO, 'http://testurl/', 'video/mp4');

            assertEquals('video/mp4', stubCreateElementResults.source.type);
        });
    };

    this.HTML5MediaPlayerTests.prototype.testPlayPassedThroughToMediaElementWhenInStoppedState = function(queue) {
        expectAsserts(2);
        this.runMediaPlayerTest(queue, function (MediaPlayer) {
            this._mediaPlayer.setSource(MediaPlayer.TYPE.VIDEO, 'http://testurl/', 'video/mp4');

            assert(stubCreateElementResults.video.play.notCalled);

            this._mediaPlayer.play();

            assert(stubCreateElementResults.video.play.calledOnce);
        });
    };

    this.HTML5MediaPlayerTests.prototype.testWeDoNotAccessSeekableRangesWhenThereAreNoSeekableRanges = function(queue) {
        expectAsserts(3);
        this.runMediaPlayerTest(queue, function (MediaPlayer) {
            this._mediaPlayer.setSource(MediaPlayer.TYPE.VIDEO, 'http://testurl/', 'video/mp4');
            stubCreateElementResults.video.seekable.length = 0;
            assertUndefined(this._mediaPlayer.getRange());
            assert(stubCreateElementResults.video.seekable.start.notCalled);
            assert(stubCreateElementResults.video.seekable.end.notCalled);
        });
    };

    this.HTML5MediaPlayerTests.prototype.testSeekableTimesObtainedFromFirstSeekableRange = function(queue) {
        expectAsserts(2);
        this.runMediaPlayerTest(queue, function (MediaPlayer) {
            stubCreateElementResults.video.seekable.length = 1;
            this._mediaPlayer.setSource(MediaPlayer.TYPE.VIDEO, 'http://testurl/', 'video/mp4');
            this._mediaPlayer.getRange();
            assert(stubCreateElementResults.video.seekable.start.alwaysCalledWith(0));
            assert(stubCreateElementResults.video.seekable.end.alwaysCalledWith(0));
        });
    };

    this.HTML5MediaPlayerTests.prototype.testWhenThereAreManySeekableRangesGetRangeReturnsUndefinedAndThisIsLogged = function(queue) {
        expectAsserts(2);
        this.runMediaPlayerTest(queue, function (MediaPlayer) {
            var warnStub = this.sandbox.stub();
            this.sandbox.stub(this._device, "getLogger").returns({warn: warnStub});
            stubCreateElementResults.video.seekable.length = 2;
            this._mediaPlayer.setSource(MediaPlayer.TYPE.VIDEO, 'http://testurl/', 'video/mp4');
            assertUndefined(this._mediaPlayer.getRange());
            assert(warnStub.calledWith("Multiple seekable ranges detected"));
        });
    };


    // WARNING WARNING WARNING WARNING: These TODOs are NOT exhaustive.
    // TODO: getRange() returns the actual range. Must check seekable.length. If zero, no range is available. Should also pass indexes to start and end.
    // TODO: Ensure video object is full screen.
    // TODO: Ensure video object is anchored top/left
    // TODO: playFrom(...) actually plays, from specified point.
    // TODO: pause() actually pauses.
    // TODO: play() actually plays, when paused
    // TODO: call load() at end of setSource
    // TODO: Handle audio/video.duration === NaN when unknown  https://developer.mozilla.org/en/docs/Web/API/HTMLMediaElement
    // TODO: Handle audio/video.duration === Inf when not pre-defined  https://developer.mozilla.org/en/docs/Web/API/HTMLMediaElement
    // TODO: Handle audio/video.duration === 0 when unknown  https://developer.mozilla.org/en/docs/Web/API/HTMLMediaElement
    // TODO: Ensure that when getting the source when it contains an apostorophe is escaped (see devices/media/html5.js:166)
    // TODO: Ensure that the "src" attribute is removed from the audio/media element on tear-down (see device/media/html5.js:331 and chat with Tom W in iPlayer)
    // TODO: Ensure all video/audio object event listeners/callbacks are created on setSources
    // TODO: Ensure source object error event listeners are added on setSources
    // TODO: Ensure any source elements and callbacks are destroyed on reset()
    // TODO: Ensure playback events handled
    // TODO: Ensure error events handled (from video/audio)
    // TODO: Ensure error events handled (from source)
    // TODO: Ensure errors are logged.
    // TODO: Ensure playFrom(...) and play() both clamp to the available range (there's a _getClampedTime helper in the MediaPlayer)
    // TODO: stop() actually stops.
    // TODO: reset() clears down all event listeners (to prevent memory leaks from DOM object and JavaScript keeping each other in scope)
    // TODO: getCurrentTime() actually returns the current time.
    // TODO: Resolve all FIXMEs in common test device mocking hooks
    // TODO: Resolve all FIXMEs in production code base

    //---------------------
    // Common tests
    //---------------------

    // Setup device specific mocking
    var deviceMockingHooks = {
        setup: function(sandbox, application) {
            stubCreateElement(sandbox,application);
        },
        finishBuffering: function(mediaPlayer, currentTime, range) {

            var mediaElements = [stubCreateElementResults.video, stubCreateElementResults.audio];
            for (var i = 0; i < mediaElements.length; i++) {
                var media = mediaElements[i];
                media.seekable.length = 1;
                media.seekable.start.returns(range.start);
                media.seekable.end.returns(range.end);
                media.currentTime = currentTime;
            }

            mediaPlayer._onFinishedBuffering(); // FIXME - do not do this in an actual implementation - replace it with proper event mock / whatever.
        },
        emitPlaybackError: function(mediaPlayer) {
            mediaPlayer._onDeviceError(); // FIXME - do not do this in an actual implementation - replace it with proper event mock / whatever.
        },
        reachEndOfMedia: function(mediaPlayer) {
            mediaPlayer._onEndOfMedia();  // FIXME - do not do this in an actual implementation - replace it with proper event mock / whatever.
        },
        startBuffering: function(mediaPlayer) {
            mediaPlayer._onDeviceBuffering();  // FIXME - do not do this in an actual implementation - replace it with proper event mock / whatever.
        },
        mockTime: function(mediaplayer) {
            // FIXME - Implementations can use this hook to set up fake timers if required
        },
        makeOneSecondPass: function(mediaplayer, time) {
            mediaplayer._onStatus();  // FIXME - do not do this in an actual implementation - replace it with proper event / setTimeout mock / whatever.
        },
        unmockTime: function(mediaplayer) {
            // FIXME - Implementations can use this hook to tear down fake timers if required
        }
    };

    // Mixin the common tests shared by all MediaPlayer implementations (last, so it can detect conflicts)
    MixinCommonMediaTests(this.HTML5MediaPlayerTests, "antie/devices/mediaplayer/html5", config, deviceMockingHooks);

})();