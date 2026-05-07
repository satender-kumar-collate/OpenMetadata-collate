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

import Icon from '@ant-design/icons';
import { Button, Tooltip } from 'antd';
import classNames from 'classnames';
import { isUndefined } from 'lodash';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ReactComponent as CopyIcon } from '../../../assets/svg/ic-duplicate.svg';
import { JSON_TAB_SIZE } from '../../../constants/constants';
import { CSMode } from '../../../enums/codemirror.enum';
import { useClipboard } from '../../../hooks/useClipBoard';
import { useCodeMirror } from '../../../hooks/useCodeMirror';
import { getSchemaEditorValue } from '../../../utils/SchemaEditor.utils';
import './schema-editor.less';
import { SchemaEditorProps } from './SchemaEditor.interface';

const SchemaEditor = ({
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
}: SchemaEditorProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  const [internalValue, setInternalValue] = useState<string>(
    getSchemaEditorValue(value)
  );

  const { onCopyToClipBoard, hasCopied } = useClipboard(internalValue);
  const wasHiddenRef = useRef(false);

  const handleChange = useCallback(
    (newValue: string) => {
      const formatted = getSchemaEditorValue(newValue);
      setInternalValue(formatted);
      if (!isUndefined(onChange)) {
        onChange(formatted);
      }
    },
    [onChange]
  );

  const { editorRef, requestRefresh } = useCodeMirror({
    value: internalValue,
    mode,
    readOnly: readOnly ?? (options?.readOnly as boolean) ?? false,
    showLineNumbers: (options?.lineNumbers as boolean) ?? true,
    lineWrapping: (options?.lineWrapping as boolean) ?? true,
    showFoldGutter: (options?.foldGutter as boolean) ?? true,
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

  // Auto-detect display:none → visible transitions (e.g. Ant Design tab switches).
  // When a parent sets display:none, boundingClientRect collapses to 0.
  // When it becomes visible again, we refresh CodeMirror and reset scroll.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        const isHidden = entry.boundingClientRect.height === 0;

        if (isHidden) {
          wasHiddenRef.current = true;
        } else if (wasHiddenRef.current) {
          wasHiddenRef.current = false;
          requestRefresh();
        }
      },
      { threshold: 0 }
    );

    observer.observe(el);

    return () => observer.disconnect();
  }, [requestRefresh]);

  // Explicit refresh via prop (kept for backwards compatibility).
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (refreshEditor) {
      timer = setTimeout(() => {
        requestRefresh();
      }, 50);
    }

    return () => clearTimeout(timer);
  }, [refreshEditor, requestRefresh]);

  return (
    <div
      className={classNames('schema-editor-container relative', className)}
      data-testid="code-mirror-container"
      ref={containerRef}>
      {showCopyButton && (
        <div className="query-editor-button">
          <Tooltip
            title={
              hasCopied ? t('label.copied') : t('message.copy-to-clipboard')
            }>
            <Button
              className="query-editor-copy-button"
              data-testid="query-copy-button"
              icon={<Icon component={CopyIcon} />}
              onClick={() => onCopyToClipBoard(internalValue)}
            />
          </Tooltip>
        </div>
      )}

      <div className={editorClass} ref={editorRef} />
    </div>
  );
};

export default SchemaEditor;
