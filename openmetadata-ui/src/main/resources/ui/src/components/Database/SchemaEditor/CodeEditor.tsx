/*
 *  Copyright 2022 Collate.
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *  http://www.apache.org/licenses/LICENSE-2.0
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

import { Button, Card, Tooltip } from 'antd';
import classNames from 'classnames';
import { isUndefined } from 'lodash';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ReactComponent as CopyIcon } from '../../../assets/svg/copy-left.svg';
import { JSON_TAB_SIZE } from '../../../constants/constants';
import { CSMode } from '../../../enums/codemirror.enum';
import { useClipboard } from '../../../hooks/useClipBoard';
import { useCodeMirror } from '../../../hooks/useCodeMirror';
import { getSchemaEditorValue } from '../../../utils/SchemaEditor.utils';
import './schema-editor.less';
import { SchemaEditorProps } from './SchemaEditor.interface';

const CodeEditor = ({
  value = '',
  className = '',
  mode = {
    name: CSMode.JAVASCRIPT,
    json: true,
  },
  options,
  readOnly,
  editorClass,
  showCopyButton = true,
  onChange,
  onFocus,
  refreshEditor,
  title,
}: SchemaEditorProps) => {
  const { t } = useTranslation();

  const [internalValue, setInternalValue] = useState<string>(
    getSchemaEditorValue(value)
  );

  const { onCopyToClipBoard, hasCopied } = useClipboard(internalValue);

  const handleChange = useCallback(
    (newValue: string) => {
      setInternalValue(newValue);
      if (!isUndefined(onChange)) {
        onChange(newValue);
      }
    },
    [onChange]
  );

  const { editorRef, viewRef, requestRefresh } = useCodeMirror({
    value: internalValue,
    mode,
    readOnly: readOnly ?? (options?.readOnly as boolean) ?? false,
    showLineNumbers: (options?.lineNumbers as boolean) ?? false,
    lineWrapping: (options?.lineWrapping as boolean) ?? false,
    showFoldGutter: false,
    styleActiveLine: (options?.styleActiveLine as boolean) ?? true,
    matchBrackets: (options?.matchBrackets as boolean) ?? true,
    autoCloseBrackets: (options?.autoCloseBrackets as boolean) ?? true,
    tabSize:
      options?.tabSize !== undefined ? Number(options.tabSize) : JSON_TAB_SIZE,
    onChange: handleChange,
    onFocus,
  });

  useEffect(() => {
    setInternalValue(getSchemaEditorValue(value));
  }, [value]);

  useEffect(() => {
    if (refreshEditor) {
      // CM6 can't measure its container if hidden (e.g., in an inactive tab with display: none).
      // Delaying refresh by 50ms ensures the editor is visible and DOM is ready to re-render.
      setTimeout(() => {
        requestRefresh();
      }, 50);
    }
  }, [refreshEditor, requestRefresh]);

  return (
    <Card
      className={classNames(className, 'code-editor-new-style')}
      data-testid="code-mirror-container"
      extra={
        showCopyButton && (
          <div data-testid="copy-button-container">
            <Tooltip
              title={
                hasCopied ? t('label.copied') : t('message.copy-to-clipboard')
              }>
              <Button
                className="flex-center"
                data-testid="query-copy-button"
                icon={<CopyIcon height={16} width={16} />}
                size="small"
                type="text"
                onClick={() => onCopyToClipBoard()}
              />
            </Tooltip>
          </div>
        )
      }
      title={title}>
      <div
        className={editorClass}
        data-testid="code-mirror-editor"
        ref={editorRef}
        // viewRef used for refresh; expose view via data attribute for tests
        data-view={viewRef.current ? 'mounted' : 'pending'}
      />
    </Card>
  );
};

export default CodeEditor;
