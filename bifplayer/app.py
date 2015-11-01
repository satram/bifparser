#!/usr/bin/env python
""" simple tornado based backend"""
import os
import logging

import tornado.ioloop
from tornado.web import StaticFileHandler, RequestHandler
from tornado.options import define, options


log = logging.getLogger('tornado-application')

define("port",
       default=8888,
       type=int,
       help="run on the given port")


class Application(tornado.web.Application):

    """ This is the main Tornado application for the ITM Webapp backend """

    def __init__(self):
        self.images_path = os.path.join(
            os.path.dirname(__file__),
            'static/images')
        handlers = [
            (r"/",
             MainHandler),
            (r"/api/images/(.*\.bif)",
             StaticFileHandler, {"path": self.images_path})
        ]
        settings = dict(
            cookie_secret="__TODO:_GENERATE_YOUR_OWN_RANDOM_VALUE_HERE__",
            template_path=os.path.join(os.path.dirname(__file__), "templates"),
            static_path=os.path.join(os.path.dirname(__file__), "static"),
            xsrf_cookies=False,
        )
        tornado.web.Application.__init__(self, handlers, **settings)

    def cleanup(self):
        ''' Whatever cleanup work we need to do prior to
            exiting the application goes here.'''
        log.info('Start application cleanup')
        # Cleanup any temporary preset files created for added jobs
        self.images_path = ''


class MainHandler(RequestHandler):

    """ Main handler for loading the front UI index.html """

    def get(self):
        # Pass all command line options as a
        template_options = options.as_dict()
        self.render("index.html", **template_options)


def main():
    """ Main method, invoking the tornado app """

    tornado.options.parse_command_line()
    log.debug('parsed command line')
    log.debug('log level is %s', options.logging)

    app = Application()
    log.debug('init the tornado app')
    app.listen(options.port)
    log.debug('set the port')

    try:
        log.debug('starting the loop...')
        tornado.ioloop.IOLoop.current().start()
    finally:
        app.cleanup()


if __name__ == "__main__":
    main()
