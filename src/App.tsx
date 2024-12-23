import { useEffect, useRef, useState } from 'react';
import { Button, Col, Form, Input, message, Modal, Radio, Row, Space, Spin, Table, } from 'antd';
import { fanyiBaiDuFn, languageBulkWriteFn, languageDeleteManyFn, languageExportFn, languageListFn } from './webapi';
import { LANGUAGE_LIST, PAGE_SIZE } from './data';
import './App.css';

export default function App() {
  const [dataSource, setDataSource] = useState<Array<IObject>>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [visible, setVisible] = useState(false);
  const [isExportVisible, setExportVisible] = useState(false);
  const [total, setTotal] = useState(0);
  const [selectedRowKeys, setSelectedRowKeys] = useState<Array<string>>([]);
  const [listParams, setListParams] = useState({
    pageNum: 0,
    pageSize: PAGE_SIZE,
  });
  const isUseEffect = useRef(false);
  const [saveStatus, setSaveStatus] = useState<IObject>({});
  const [form] = Form.useForm();
  const [isBtnLoading, setIsBtnLoading] = useState(false);

  useEffect(() => {
    if(isUseEffect?.current) return;

    isUseEffect.current = true;
    
    /** 查询语言列表 - 操作 */
    getLanguageListFn();
  }, [])

  /**
   * Spin显示、隐藏 - 操作
   * @param val 
   */
  const onToggleSpinChange = (val: boolean) => {
    const value = Boolean(val);
    if(value) {
      setIsSpinning(true);
    }else {
      setTimeout(() => {
        setIsSpinning(false);
        isUseEffect.current = false;
      }, 360);
    }
  }

  /**
   * 查询语言列表 - 操作
   */
  const getLanguageListFn = async (params?: IObject) => {
    const params_new = {
      ...listParams,
      ...params,
    }
    if(!isSpinning) {
      /** 开启loading */
      onToggleSpinChange(true);
    }
    const result = await languageListFn(params_new).finally(() => {
      /** 关闭loading */
      onToggleSpinChange(false);
    });

    const list = result?.content || [];
    if(Array.isArray(list) && list.length) {
      list.forEach(item => {
        if(item && Object.keys(item).length) {
          Object.assign(item, {
            ...item?.info,
          })

          delete item?.info;
        }
      })
    }else if(params_new?.pageNum > 0) {
      /** 查询语言列表 - 操作 */
      return getLanguageListFn({
        pageNum: params_new?.pageNum - 1,
      });
    }
    setDataSource(list);
    setListParams(params_new);
    setTotal(result?.total ?? 0);
  }

  /**
   * 翻译 - 操作
   * @param id 
   * @param params 
   * @returns 
   */
  const onFanYiClick = async (id: string, params: {
    text: string;
    language: string;
  }) => {
    if(!params || !Object.keys(params).length) return;

    const { text, language, } = params;
    if(!id || !text || !language) return;

    /** 开启loading */
    onToggleSpinChange(true);
    const result = await fanyiBaiDuFn(params).finally(() => {
      /** 关闭loading */
      onToggleSpinChange(false);
    });

    setSaveStatus(data => ({ ...data, [id]: 1, }));
    setDataSource(data => {
      return data.map(item => {
        if(item?.id === id) {
          return {
            ...item,
            [language]: result,
          };
        }
        return item;
      })
    });
  }

  /**
   * 新增行 - 操作
   * @param values 
   */
  const onAddRowClick = async (values: IObject) => {
    const result = await onSaveClick(false, {
      id: `${Date.now()}`,
      ...values,
    }, "add");

    if(!result) return;
    
    setVisible(false);

    /** 查询语言列表 - 操作 */
    getLanguageListFn({
      pageNum: 0,
    });
  }

  /**
   * 输入语言内容 - 监听操作
   * @param id 
   * @param key 
   * @param value 
   */
  const onTextAreaChange = (id: string, key: string, value: string) => {
    if(!id || !key) return;

    setSaveStatus(data => ({ ...data, [id]: 1, }));
    setDataSource(data => {
      return data.map(item => {
        if(item?.id === id) {
          return {
            ...item,
            [key]: value,
          };
        }
        return item;
      })
    });
  }

  /**
   * 保存 - 操作
   * @param isBatch 
   * @param params 
   */
  const onSaveClick = (isBatch = false, params: IObject, action: Ii18nAction) => {
    const list: IObject[] = [];
    if(!isBatch) {
      if(!params || !Object.keys(params).length) return;

      const { id, ...rest } = params;
      list.push({
        id,
        info: rest,
      });
    }
    if(!Array.isArray(list) || !list.length) return;

    /** 开启loading */
    onToggleSpinChange(true);
    return languageBulkWriteFn(list, action).finally(() => {
      /** 关闭loading */
      onToggleSpinChange(false);
      setSaveStatus(data => ({ ...data, [params?.id]: 0, }));
    });
  }

  /**
   * 删除 - 操作
   * @param isBatch 
   * @param params 
   */
  const onDeleteClick = async (isBatch = false, params: IObject) => {
    const ids: string | any[] = [];
    if(!isBatch) {
      if(!params || !Object.keys(params).length) return;

      ids.push(params?.id);
    }
    if(!Array.isArray(ids) || !ids.length) return;

    /** 开启loading */
    onToggleSpinChange(true);
    const result = await languageDeleteManyFn(ids);
    if(!result) {
      /** 关闭loading */
      return onToggleSpinChange(false);
    }
    
    /** 查询语言列表 - 操作 */
    getLanguageListFn();
  }

  /**
   * 导出 - 操作
   * @param values 
   */
  const onExportClick = async (values: IObject) => {
    if(!values || !Object.keys(values).length) return;

    const { type, language, } = values;
    const params = {
      language,
    };
    if(type === "1") {
      if(!Array.isArray(selectedRowKeys) || !selectedRowKeys.length) {
        return message.error("请选择导出的数据");
      }

      Object.assign(params, {
        ids: selectedRowKeys,
      })
    }

    /** 开启loading */
    onToggleSpinChange(true);
    const result = await languageExportFn({...params}).finally(() => {
      /** 关闭loading */
      onToggleSpinChange(false);
    });

    if(!result) return;

    setSelectedRowKeys([]);
    setExportVisible(false);
  }

  return (
    <>
      <Spin
        spinning={ isSpinning }
      >
        <div className='language_app'>
          <Form
            autoComplete="off"
            layout="inline"
            onFinish={values => {
              /** 查询语言列表 - 操作 */
              getLanguageListFn({
                pageNum: 0,
                ...values,
              });
            }}
            labelWrap
          >
            <Form.Item label="中文" name="zh">
              <Input placeholder="请输入" 
                style={{ width: 360, }}
              />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit">
                搜索
              </Button>
            </Form.Item>

            <Form.Item>
              <Space className='language_app__top'>
                <Button
                  type="primary"
                  onClick={() => setVisible(true)}
                >新增行</Button>

                <Button
                  type="primary"
                  onClick={() => setExportVisible(true)}
                >导出</Button>
              </Space>
            </Form.Item>
          </Form>

          <Table
            dataSource={ dataSource }
            rowKey="id"
            pagination={{
              current: listParams?.pageNum + 1,
              pageSize: listParams?.pageSize || PAGE_SIZE,
              total,
              showTotal: (n) => `共 ${ n } 条`,
              showSizeChanger: true,
              showQuickJumper: true,
              onChange: (num, size) => {
                /** 查询语言列表 - 操作 */
                getLanguageListFn({
                  pageNum: num - 1,
                  pageSize: size,
                });
              }
            }}
            rowSelection={{
              selectedRowKeys,
              onSelect: (record, selected) => {
                const rowKeys = [record?.id].filter(Boolean);
                if(selected) {
                  setSelectedRowKeys(data => {
                    return [...new Set([...data, ...rowKeys])];
                  });
                }else {
                  setSelectedRowKeys(data => {
                    return data.filter(item => !rowKeys.includes(item));
                  });
                }
              },
              onSelectAll: (selected, selectedRows, changeRows) => {
                let rowKeys: Array<string> = [];
                if(selected) {
                  rowKeys = selectedRows?.map?.(item => item?.id)?.filter?.(Boolean) || [];
                  setSelectedRowKeys(data => {
                    return [...new Set([...data, ...rowKeys])];
                  });
                }else {
                  rowKeys = changeRows?.map?.(item => item?.id)?.filter?.(Boolean) || [];
                  setSelectedRowKeys(data => {
                    return data.filter(item => !rowKeys.includes(item));
                  });
                }
                
              }
            }}
          >
            <Table.Column 
              title="序号" 
              key="index" 
              width="80px"
              align='center'
              render={(_text, _row, index) => `${ index + 1 }`}
            />

            {
              LANGUAGE_LIST.map(item => {
                const language = item?.language;
                return (
                  <Table.Column 
                    {...item}
                    key={ language }
                    dataIndex={ language }
                    render={(text, row, index) => {
                      return <Row align="middle">
                        <Input.TextArea 
                          value={ text } 
                          style={{ flex: 1, }}
                          placeholder={ `请输入${ item?.title }` }
                          onChange={(e) => onTextAreaChange?.(row?.id, language, e?.target?.value ?? "")}
                          readOnly={ ["zh"].includes(language) }
                        />
          
                        {
                          !["zh"].includes(language) ? (
                            <Button
                              type="primary"
                              onClick={() => onFanYiClick(row?.id, {
                                text: row?.zh,
                                language,
                              })}
                              style={{ marginLeft: "16px", }}
                            >翻译</Button>
                          ) : null
                        }
                      </Row>
                    }}
                  />
                );
              })
            }
            
            <Table.Column 
              title="操作" 
              width="100px"
              render={(row) => {
                return (
                  <Space>
                    <Button
                      type="primary"
                      disabled={ saveStatus[row?.id] !== 1 }
                      onClick={() => onSaveClick(false, row, "update")}
                    >保存</Button>

                    <Button
                      onClick={() => onDeleteClick(false, row)}
                    >删除</Button>
                  </Space>
                );
              }}
            />
          </Table>
        </div>
      </Spin>
    
      <Modal 
        title="新增行" 
        open={ visible } 
        destroyOnClose
        okButtonProps={{ htmlType: 'submit', }}
        onCancel={() => setVisible(false)}
        modalRender={(dom) => (
          <Form
            layout="vertical"
            clearOnDestroy
            autoComplete="off"
            onFinish={(values) => onAddRowClick(values)}
            form={ form }
          >
            { dom }
          </Form>
        )}
      >
        {
          LANGUAGE_LIST.map(item => {
            return (
              <Form.Item
                key={ item?.language }
                label={
                  item?.language !== 'zh' ? (
                    <Row>
                      <Col span={ 12 }>{ item?.title }</Col>
                      <Col span={ 12 }>
                        <Button 
                          type="primary" 
                          size="small"
                          loading={ isBtnLoading }
                          onClick={async () => {
                            const text = form?.getFieldValue("zh") as string;
                            if(!text?.trim?.()) {
                              return form.validateFields(["zh"]);
                            };
                            
                            setIsBtnLoading(true);
                            const result = await fanyiBaiDuFn({
                              text,
                              language: item?.language,
                            }).finally(() => {
                              setTimeout(() => {
                                setIsBtnLoading(false);
                              }, 360);
                            });

                            form?.setFieldsValue({
                              [item?.language]: result,
                            });
                          }}
                        >翻译</Button>
                      </Col>
                    </Row>
                  ) : item?.title
                }
                name={ item?.language }
                rules={[{ 
                  required: true,
                  whitespace: true,
                  message: `请输入`,
                }]}
              >
                <Input.TextArea 
                  placeholder="请输入"
                />
              </Form.Item>
            );
          })
        }
      </Modal>

      <Modal 
        title="导出" 
        open={ isExportVisible } 
        destroyOnClose
        okButtonProps={{ htmlType: 'submit', }}
        onCancel={() => setExportVisible(false)}
        modalRender={(dom) => (
          <Form
            layout="vertical"
            clearOnDestroy
            autoComplete="off"
            onFinish={(values) => onExportClick(values)}
          >
            { dom }
          </Form>
        )}
        confirmLoading={ isSpinning }
      >
        <Form.Item
          label="语言"
          name="language"
          rules={[{ 
            required: true,
            message: "请选择语言",
          }]}
        >
          <Radio.Group>
            {
              LANGUAGE_LIST.map(item => {
                return (
                  <Radio 
                    key={ item?.language }
                    value={ item?.language }
                  >{ item?.title }</Radio>
                );
              })
            }
          </Radio.Group>
        </Form.Item>

        <Form.Item
          label="导出方式"
          name="type"
          rules={[{ 
            required: true,
            message: "请选择导出方式",
          }]}
        >
          <Radio.Group>
            <Radio value="0">导出全部数据</Radio>
            <Radio value="1">导出已选择的数据</Radio>
          </Radio.Group>
        </Form.Item>
      </Modal>
    </>
  );
};