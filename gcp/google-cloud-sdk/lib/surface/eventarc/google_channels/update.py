# -*- coding: utf-8 -*- #
# Copyright 2022 Google LLC. All Rights Reserved.
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
"""Command to update the specified google channel."""

from __future__ import absolute_import
from __future__ import division
from __future__ import unicode_literals

from googlecloudsdk.api_lib.eventarc import google_channels
from googlecloudsdk.calliope import base
from googlecloudsdk.command_lib.eventarc import flags
from googlecloudsdk.command_lib.util.args import labels_util

_DETAILED_HELP = {
    'DESCRIPTION':
        '{description}',
    'EXAMPLES':
        """ \
        To update the Google channel in location `us-central1`, run:

          $ {command} --location=us-central1

        To configure the Google channel in location `us-central1` with a Cloud KMS CryptoKey, run:

          $ {command} --location=us-central1 --crypto-key=projects/PROJECT_ID/locations/KMS_LOCATION/keyRings/KEYRING/cryptoKeys/KEY

        """,
}


@base.ReleaseTracks(base.ReleaseTrack.GA)
@base.DefaultUniverseOnly
class Update(base.UpdateCommand):
  """Update an Eventarc Google channel."""

  detailed_help = _DETAILED_HELP

  @classmethod
  def Args(cls, parser):
    flags.AddLocationResourceArg(
        parser, 'The location of the Google Channel.', required=True)
    flags.AddCryptoKeyArg(parser, with_clear=True)
    labels_util.AddUpdateLabelsFlags(parser)

  def Run(self, args):
    """Run the update command."""
    client = google_channels.GoogleChannelConfigClientV1()
    location_name = args.CONCEPTS.location.Parse().RelativeName()
    config_name = f'{location_name}/googleChannelConfig'

    original_google_channel = client.Get(config_name)
    labels_update_result = labels_util.Diff.FromUpdateArgs(args).Apply(
        client.LabelsValueClass(), original_google_channel.labels
    )

    update_mask = client.BuildUpdateMask(
        crypto_key=args.IsSpecified('crypto_key'),
        clear_crypto_key=args.clear_crypto_key,
        labels=labels_update_result.needs_update,
    )

    crypto_key_name = ''
    if args.IsSpecified('crypto_key'):
      crypto_key_name = args.crypto_key
    response = client.Update(
        config_name,
        client.BuildGoogleChannelConfig(
            config_name,
            crypto_key_name,
            labels=labels_update_result.GetOrNone(),
        ),
        update_mask,
    )

    return response
