import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, FileText, UploadCloud, CheckCircle, Calendar, Eye,
  Bold, Italic, Underline, Link, X, ChevronDown, Send
} from 'lucide-react';

const TeacherCreateAssignment = () => {
  const navigate = useNavigate();

  return (
    <div style={{ paddingBottom: '80px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header Section */}
      <div style={{ marginBottom: '24px' }}>
        <button 
          onClick={() => navigate('/teacher/assignments')}
          style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '6px', 
            color: '#6B7280', 
            background: 'none', 
            border: 'none', 
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 600,
            marginBottom: '8px',
            padding: 0,
            transition: 'color 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.color = '#2563EB'}
          onMouseOut={(e) => e.currentTarget.style.color = '#6B7280'}
        >
          <ArrowLeft size={16} /> Quay lại Quản lý bài tập
        </button>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', margin: '0 0 4px 0', letterSpacing: '-0.025em' }}>
              Tạo bài tập mới
            </h1>
            <p style={{ fontSize: '14px', color: '#6B7280', margin: 0 }}>
              Thiết lập thông tin đề bài, tệp đính kèm, tiêu chí chấm và lịch nộp bài cho lớp học.
            </p>
          </div>
          
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: '8px', 
            backgroundColor: 'white', padding: '6px 14px', 
            borderRadius: '8px', border: '1px solid #E5E7EB', 
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            alignSelf: 'flex-start'
          }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981' }}></span>
            <span style={{ fontSize: '12px', color: '#6B7280' }}>Đang giao cho:</span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#1F2937' }}>ENG-IELTS-6.5A (Intensive)</span>
            <button style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', marginLeft: '4px', padding: 0 }}>
              <ChevronDown size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Grid Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
        <style>{`
          @media (min-width: 1024px) {
            .create-grid { grid-template-columns: 2fr 1fr !important; }
          }
          .input-field {
            width: 100%; padding: 10px 14px; background-color: #F8FAFC; border: 1px solid #E2E8F0;
            border-radius: 8px; font-size: 14px; color: #1E293B; outline: none; transition: all 0.2s;
            box-sizing: border-box;
          }
          .input-field:focus {
            background-color: white; border-color: #3B82F6; box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
          }
          .label-text {
            display: block; font-size: 12px; font-weight: 600; color: #334155; 
            text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;
          }
          .card-wrapper {
            background-color: white; border-radius: 12px; border: 1px solid #E2E8F0;
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); padding: 24px;
          }
          .card-header {
            display: flex; align-items: center; gap: 10px; padding-bottom: 16px; 
            border-bottom: 1px solid #F1F5F9; margin-bottom: 20px;
          }
        `}</style>
        <div className="create-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
          
          {/* LEFT COLUMN */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* CARD 1: Assignment Details */}
            <section className="card-wrapper">
              <div className="card-header">
                <div style={{ padding: '8px', backgroundColor: '#EFF6FF', color: '#2563EB', borderRadius: '8px' }}>
                  <FileText size={20} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>Assignment Details</h2>
                  <p style={{ margin: 0, fontSize: '12px', color: '#94A3B8' }}>Thông tin tiêu đề, mô tả và phân loại bài tập</p>
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label className="label-text">
                    Tiêu đề bài tập <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="Ví dụ: HW-06: IELTS Writing Task 2 - Renewable Energy Essay" 
                    defaultValue="HW-06: IELTS Writing Task 2 - Renewable Energy Essay"
                    style={{ fontWeight: 500 }}
                  />
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  <div>
                    <label className="label-text">Kỹ năng giảng dạy</label>
                    <select className="input-field">
                      <option value="writing">Writing (Kỹ năng Viết)</option>
                      <option value="speaking">Speaking (Kỹ năng Nói)</option>
                      <option value="reading">Reading (Kỹ năng Đọc)</option>
                      <option value="listening">Listening (Kỹ năng Nghe)</option>
                    </select>
                  </div>
                  <div>
                    <label className="label-text">Dạng đề bài</label>
                    <select className="input-field">
                      <option value="task2">IELTS Writing Task 2 (Essay)</option>
                      <option value="task1">IELTS Writing Task 1 (Report/Letter)</option>
                      <option value="custom">Tự luận / Đoạn văn tự do</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="label-text">Đề bài & Hướng dẫn chi tiết</label>
                  <div style={{ border: '1px solid #E2E8F0', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#F8FAFC' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px', backgroundColor: '#F1F5F9', borderBottom: '1px solid #E2E8F0' }}>
                      <button style={{ padding: '6px', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '4px', color: '#475569', fontWeight: 'bold' }}>B</button>
                      <button style={{ padding: '6px', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '4px', color: '#475569', fontStyle: 'italic', fontFamily: 'serif' }}>I</button>
                      <button style={{ padding: '6px', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '4px', color: '#475569', textDecoration: 'underline' }}>U</button>
                      <div style={{ width: '1px', height: '16px', backgroundColor: '#CBD5E1', margin: '0 4px' }}></div>
                      <button style={{ padding: '6px', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '4px', color: '#475569' }}><Bold size={14} /></button>
                      <button style={{ padding: '6px', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '4px', color: '#475569' }}><Link size={14} /></button>
                    </div>
                    <textarea 
                      className="input-field" 
                      style={{ border: 'none', backgroundColor: 'white', borderRadius: 0, resize: 'vertical' }}
                      rows={4}
                      defaultValue="The burning of fossil fuels has caused substantial environmental damage over the last century. Some people believe that renewable energy resources should replace fossil fuels entirely, while others argue that doing so is impractical. Discuss both views and give your opinion. (Tối thiểu 250 từ, đảm bảo 4 tiêu chí: TR, CC, LR, GRA)."
                    ></textarea>
                  </div>
                </div>
              </div>
            </section>

            {/* CARD 2: Import From Files */}
            <section className="card-wrapper">
              <div className="card-header" style={{ justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ padding: '8px', backgroundColor: '#EEF2FF', color: '#4F46E5', borderRadius: '8px' }}>
                    <UploadCloud size={20} />
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>Import From Files</h2>
                    <p style={{ margin: 0, fontSize: '12px', color: '#94A3B8' }}>Đính kèm file đề bài, hình ảnh minh họa hoặc rubric chấm</p>
                  </div>
                </div>
                <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 500 }}>Đã tải lên: 2 tệp</span>
              </div>
              
              <div style={{ 
                border: '2px dashed #BFDBFE', backgroundColor: 'rgba(239, 246, 255, 0.4)',
                borderRadius: '12px', padding: '24px', textAlign: 'center', cursor: 'pointer',
                transition: 'all 0.2s'
              }}>
                <div style={{ 
                  width: '48px', height: '48px', margin: '0 auto 12px', borderRadius: '50%', 
                  backgroundColor: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  color: '#2563EB' 
                }}>
                  <UploadCloud size={24} />
                </div>
                <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 600, color: '#334155' }}>
                  Kéo và thả tệp đính kèm vào đây hoặc <span style={{ color: '#2563EB', textDecoration: 'underline' }}>bấm để duyệt</span>
                </p>
                <p style={{ margin: 0, fontSize: '12px', color: '#94A3B8' }}>
                  Hỗ trợ định dạng: PDF, DOCX, JPG, PNG, MP3 (Tối đa 25MB/tệp)
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', borderRadius: '8px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '4px', backgroundColor: '#FFE4E6', color: '#E11D48', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700 }}>
                      PDF
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#1E293B' }}>De_bai_Writing_Task_2_Renewable_Energy.pdf</div>
                      <div style={{ fontSize: '11px', color: '#94A3B8' }}>1.2 MB • Hoàn tất tải lên 100%</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button style={{ padding: '4px 8px', fontSize: '12px', color: '#94A3B8', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '4px' }}>Xem</button>
                    <button style={{ padding: '4px', color: '#94A3B8', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '4px' }}>
                      <X size={16} />
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', borderRadius: '8px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '4px', backgroundColor: '#FFE4E6', color: '#E11D48', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700 }}>
                      PDF
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#1E293B' }}>Rubric_IELTS_Writing_Band_Descriptors.pdf</div>
                      <div style={{ fontSize: '11px', color: '#94A3B8' }}>450 KB • Đã đính kèm làm thang chấm</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button style={{ padding: '4px 8px', fontSize: '12px', color: '#94A3B8', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '4px' }}>Xem</button>
                    <button style={{ padding: '4px', color: '#94A3B8', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '4px' }}>
                      <X size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* CARD 3: Answer Keys and Grading */}
            <section className="card-wrapper">
              <div className="card-header">
                <div style={{ padding: '8px', backgroundColor: '#ECFDF5', color: '#059669', borderRadius: '8px' }}>
                  <CheckCircle size={20} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>Answer Keys and Grading</h2>
                  <p style={{ margin: 0, fontSize: '12px', color: '#94A3B8' }}>Cấu hình thang điểm, gợi ý chấm và hỗ trợ chấm tự động bằng AI</p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px', background: 'linear-gradient(to right, rgba(239, 246, 255, 0.7), rgba(238, 242, 255, 0.7))', borderRadius: '12px', border: '1px solid #DBEAFE' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#2563EB', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CheckCircle size={16} />
                    </div>
                    <div>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#1E293B', display: 'block' }}>Kích hoạt Smart AI Grading Assistant</span>
                      <p style={{ margin: 0, fontSize: '11px', color: '#64748B' }}>Tự động sửa lỗi ngữ pháp, gợi ý band điểm IELTS sơ bộ trước khi giáo viên phê duyệt.</p>
                    </div>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input type="checkbox" defaultChecked style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }} />
                    <div style={{ width: '44px', height: '24px', backgroundColor: '#2563EB', borderRadius: '9999px', position: 'relative', transition: 'all 0.3s' }}>
                      <div style={{ position: 'absolute', top: '2px', left: '22px', width: '20px', height: '20px', backgroundColor: 'white', borderRadius: '50%', transition: 'all 0.3s', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}></div>
                    </div>
                  </label>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  <div>
                    <label className="label-text">Thang điểm đánh giá</label>
                    <select className="input-field">
                      <option value="9.0">Thang điểm 9.0 (IELTS Official Band)</option>
                      <option value="10">Thang điểm 10</option>
                      <option value="100">Thang điểm 100</option>
                    </select>
                  </div>
                  <div>
                    <label className="label-text">Bộ tiêu chí IELTS (Rubric Weight)</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingTop: '8px' }}>
                      <span style={{ padding: '2px 8px', backgroundColor: '#F1F5F9', borderRadius: '4px', fontSize: '12px', fontWeight: 500, color: '#475569' }}>TR: 25%</span>
                      <span style={{ padding: '2px 8px', backgroundColor: '#F1F5F9', borderRadius: '4px', fontSize: '12px', fontWeight: 500, color: '#475569' }}>CC: 25%</span>
                      <span style={{ padding: '2px 8px', backgroundColor: '#F1F5F9', borderRadius: '4px', fontSize: '12px', fontWeight: 500, color: '#475569' }}>LR: 25%</span>
                      <span style={{ padding: '2px 8px', backgroundColor: '#F1F5F9', borderRadius: '4px', fontSize: '12px', fontWeight: 500, color: '#475569' }}>GRA: 25%</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="label-text">Bài mẫu / Đáp án đối chiếu (Tùy chọn)</label>
                  <textarea 
                    className="input-field" 
                    placeholder="Dán bài viết mẫu Band 8.0+ hoặc dàn ý chi tiết để học sinh so sánh sau khi hoàn thành bài nộp..." 
                    rows={3}
                  ></textarea>
                </div>
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* CARD 4: Schedule */}
            <section className="card-wrapper">
              <div className="card-header">
                <div style={{ padding: '8px', backgroundColor: '#FFFBEB', color: '#D97706', borderRadius: '8px' }}>
                  <Calendar size={20} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>Schedule</h2>
                  <p style={{ margin: 0, fontSize: '12px', color: '#94A3B8' }}>Lên lịch mở đề và thời hạn nộp bài</p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label className="label-text">Ngày bắt đầu mở đề</label>
                  <input type="datetime-local" className="input-field" defaultValue="2026-09-10T08:00" />
                </div>
                <div>
                  <label className="label-text">Hạn chót nộp bài (Due date) <span style={{ color: '#EF4444' }}>*</span></label>
                  <input type="datetime-local" className="input-field" defaultValue="2026-09-15T23:59" style={{ fontWeight: 500 }} />
                </div>
                
                <div style={{ paddingTop: '8px', borderTop: '1px solid #F1F5F9' }}>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                    <input type="checkbox" defaultChecked style={{ marginTop: '2px', accentColor: '#2563EB' }} />
                    <span style={{ fontSize: '12px', color: '#475569', lineHeight: 1.4 }}>
                      <strong style={{ fontWeight: 600, color: '#1E293B', display: 'block' }}>Cho phép nộp bài muộn</strong>
                      <span style={{ color: '#94A3B8', display: 'block', marginTop: '2px' }}>Tối đa trễ 24 giờ sau hạn chót (tự động gắn cờ "Nộp muộn").</span>
                    </span>
                  </label>
                </div>

                <div>
                  <label className="label-text">Thời lượng làm bài có bấm giờ</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="number" className="input-field" defaultValue="60" style={{ width: '96px' }} />
                    <span style={{ fontSize: '12px', color: '#64748B' }}>Phút (để trống nếu không giới hạn)</span>
                  </div>
                </div>
              </div>
            </section>

            {/* CARD 5: Status & Target */}
            <section className="card-wrapper">
              <div className="card-header">
                <div style={{ padding: '8px', backgroundColor: '#FAF5FF', color: '#9333EA', borderRadius: '8px' }}>
                  <Eye size={20} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>Status & Target</h2>
                  <p style={{ margin: 0, fontSize: '12px', color: '#94A3B8' }}>Trạng thái công bố và đối tượng nhận bài</p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label className="label-text" style={{ marginBottom: '8px' }}>Trạng thái bài tập</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', borderRadius: '8px', border: '1px solid #3B82F6', backgroundColor: '#EFF6FF', color: '#1D4ED8', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                      <input type="radio" name="publish_status" value="active" defaultChecked style={{ accentColor: '#2563EB' }} />
                      Công khai ngay
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0', backgroundColor: 'white', color: '#475569', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                      <input type="radio" name="publish_status" value="draft" style={{ accentColor: '#2563EB' }} />
                      Lưu bản nháp
                    </label>
                  </div>
                </div>

                <div>
                  <label className="label-text" style={{ marginBottom: '8px' }}>Đối tượng giao bài</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#334155', fontWeight: 500, cursor: 'pointer' }}>
                      <input type="radio" name="audience" defaultChecked style={{ accentColor: '#2563EB' }} />
                      Toàn bộ học viên trong lớp (24 học viên)
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#334155', fontWeight: 500, cursor: 'pointer' }}>
                      <input type="radio" name="audience" style={{ accentColor: '#2563EB' }} />
                      Chỉ định học viên / nhóm cụ thể
                    </label>
                  </div>
                </div>

                <div style={{ paddingTop: '12px', borderTop: '1px solid #F1F5F9' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                    <input type="checkbox" defaultChecked style={{ accentColor: '#2563EB' }} />
                    <span style={{ fontSize: '12px', color: '#334155', fontWeight: 500 }}>
                      Gửi email & thông báo app đến học viên
                    </span>
                  </label>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div style={{ 
        position: 'fixed', bottom: 0, left: '256px', right: 0, 
        backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(8px)',
        borderTop: '1px solid #E2E8F0', padding: '14px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        zIndex: 30, boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.05)'
      }}>
        <button 
          onClick={() => navigate('/teacher/assignments')}
          style={{ 
            padding: '8px 16px', fontSize: '12px', fontWeight: 600, color: '#475569', 
            background: 'none', border: 'none', cursor: 'pointer', borderRadius: '8px' 
          }}
        >
          Hủy bỏ (Cancel)
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button style={{ 
            padding: '8px 16px', fontSize: '12px', fontWeight: 600, color: '#334155', 
            backgroundColor: 'white', border: '1px solid #CBD5E1', borderRadius: '8px', cursor: 'pointer'
          }}>
            Lưu bản nháp (Save as Draft)
          </button>
          <button 
            onClick={() => navigate('/teacher/assignments')}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px 24px', fontSize: '12px', fontWeight: 700, color: 'white', 
              backgroundColor: '#2563EB', border: 'none', borderRadius: '8px', cursor: 'pointer',
              boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)'
            }}
          >
            Xuất bản bài tập (Publish)
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeacherCreateAssignment;
