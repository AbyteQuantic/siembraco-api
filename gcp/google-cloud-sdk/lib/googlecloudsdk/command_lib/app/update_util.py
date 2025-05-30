# -*- coding: utf-8 -*- #
# Copyright 2018 Google LLC. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Utilities for `gcloud app update` command."""

from googlecloudsdk.api_lib.app.api import appengine_app_update_api_client
from googlecloudsdk.calliope import arg_parsers
from googlecloudsdk.core import log
from googlecloudsdk.core.console import progress_tracker


def AddAppUpdateFlags(parser):
  """Add the common flags to a app update command."""

  parser.add_argument(
      '--split-health-checks',
      action=arg_parsers.StoreTrueFalseAction,
      help='Enables/disables split health checks by default '
      'on new deployments.')
  # TODO(b/181786069):unify definition of the service account params.
  parser.add_argument(
      '--service-account',
      help='The app-level default service account to update the app with.')

  parser.add_argument(
      '--ssl-policy',
      choices=['TLS_VERSION_1_0', 'TLS_VERSION_1_2'],
      help='The app-level SSL policy to update the app with.',
  )


def PatchApplication(
    release_track,
    split_health_checks=None,
    service_account=None,
    ssl_policy=None,
):
  """Updates an App Engine application via API client.

  Args:
    release_track: The release track of the app update command to run.
    split_health_checks: Boolean, whether to enable split health checks by
      default.
    service_account: str, the app-level default service account to update for
      this App Engine app.
    ssl_policy: str, the app-level SSL policy to update for this App Engine app.
      Can be TLS_VERSION_1_0 or TLS_VERSION_1_2.
  """
  api_client = appengine_app_update_api_client.GetApiClientForTrack(
      release_track
  )

  ssl_policy_enum = {
      'TLS_VERSION_1_0': (
          api_client.messages.Application.SslPolicyValueValuesEnum.DEFAULT
      ),
      'TLS_VERSION_1_2': (
          api_client.messages.Application.SslPolicyValueValuesEnum.MODERN
      ),
  }.get(ssl_policy)

  if (
      split_health_checks is not None
      or service_account is not None
      or ssl_policy_enum is not None
  ):
    with progress_tracker.ProgressTracker(
        'Updating the app [{0}]'.format(api_client.project)
    ):
      api_client.PatchApplication(
          split_health_checks=split_health_checks,
          service_account=service_account,
          ssl_policy=ssl_policy_enum,
      )
  else:
    log.status.Print('Nothing to update.')
