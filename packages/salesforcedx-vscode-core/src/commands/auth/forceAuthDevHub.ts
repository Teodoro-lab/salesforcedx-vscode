/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {
  CliCommandExecutor,
  Command,
  SfdxCommandBuilder
} from '@salesforce/salesforcedx-utils-vscode';

import { DEFAULT_ALIAS } from './authParamsGatherer';

import {
  SfdxCommandlet,
  SfdxCommandletExecutor,
  SfdxWorkspaceChecker
} from '../util';

import { workspaceUtils } from '../../util';

import { ConfigFile } from '@salesforce/core';
import {
  CancelResponse,
  ConfigSource,
  ContinueResponse,
  isNullOrUndefined,
  isSFContainerMode,
  ParametersGatherer
} from '@salesforce/salesforcedx-utils-vscode';
import { homedir } from 'os';
import * as vscode from 'vscode';
import { CLI, SFDX_CONFIG_FILE } from '../../constants';
import { nls } from '../../messages';
import { isDemoMode } from '../../modes/demo-mode';
import { OrgAuthInfo } from '../../util/index';
import {
  ForceAuthDemoModeExecutor,
  ForceAuthWebLoginContainerExecutor
} from './forceAuthWebLogin';

export class ForceAuthDevHubContainerExecutor extends ForceAuthWebLoginContainerExecutor {
  public build(data: AuthDevHubParams): Command {
    const command = new SfdxCommandBuilder().withDescription(
      nls.localize('force_auth_web_login_authorize_dev_hub_text')
    );

    command
      .withArg(CLI.AUTH_DEVICE_LOGIN)
      .withFlag('--setalias', data.alias)
      .withArg('--setdefaultdevhubusername')
      .withLogName('force_auth_device_dev_hub')
      .withJson();

    return command.build();
  }
}

export class ForceAuthDevHubExecutor extends SfdxCommandletExecutor<{}> {
  protected showChannelOutput = false;

  public build(data: AuthDevHubParams): Command {
    const command = new SfdxCommandBuilder().withDescription(
      nls.localize('force_auth_web_login_authorize_dev_hub_text')
    );

    command
      .withArg(CLI.AUTH_WEB_LOGIN)
      .withLogName('force_auth_dev_hub')
      .withFlag('--setalias', data.alias)
      .withArg('--setdefaultdevhubusername');
    return command.build();
  }
}

export class ForceAuthDevHubDemoModeExecutor extends ForceAuthDemoModeExecutor<{}> {
  public build(data: AuthDevHubParams): Command {
    return new SfdxCommandBuilder()
      .withDescription(
        nls.localize('force_auth_web_login_authorize_dev_hub_text')
      )
      .withArg(CLI.AUTH_WEB_LOGIN)
      .withFlag('--setalias', data.alias)
      .withArg('--setdefaultdevhubusername')
      .withArg('--noprompt')
      .withJson()
      .withLogName('force_auth_dev_hub_demo_mode')
      .build();
  }
}

export class AuthDevHubParamsGatherer
  implements ParametersGatherer<AuthDevHubParams> {
  public async gather(): Promise<
    CancelResponse | ContinueResponse<AuthDevHubParams>
  > {
    const aliasInputOptions = {
      prompt: nls.localize('parameter_gatherer_enter_alias_name'),
      placeHolder: DEFAULT_ALIAS
    } as vscode.InputBoxOptions;
    const alias = await vscode.window.showInputBox(aliasInputOptions);
    // Hitting enter with no alias will default the alias to 'vscodeOrg'
    if (alias === undefined) {
      return { type: 'CANCEL' };
    }
    return {
      type: 'CONTINUE',
      data: {
        alias: alias || DEFAULT_ALIAS
      }
    };
  }
}

export interface AuthDevHubParams {
  alias: string;
}

const workspaceChecker = new SfdxWorkspaceChecker();
const parameterGatherer = new AuthDevHubParamsGatherer();

export function createAuthDevHubExecutor(): SfdxCommandletExecutor<{}> {
  switch (true) {
    case isSFContainerMode():
      return new ForceAuthDevHubContainerExecutor();
    case isDemoMode():
      return new ForceAuthDevHubDemoModeExecutor();
    default:
      return new ForceAuthDevHubExecutor();
  }
}

export async function forceAuthDevHub() {
  const commandlet = new SfdxCommandlet(
    workspaceChecker,
    parameterGatherer,
    createAuthDevHubExecutor()
  );
  await commandlet.run();
}
