'use client';

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';
import type { ParsedResume } from '@/lib/ai/resume-parser';

// ---- Font Registration (Noto Sans SC for Chinese support) ----

Font.register({
  family: 'NotoSansSC',
  fonts: [
    {
      src: 'https://fonts.gstatic.com/s/notosanssc/v37/k3kCo84MPvpLmixcA63oeAL7Iqp5IZJF9bmaG9_EnYxNbPCJo4SPOvA.ttf',
      fontWeight: 'normal',
    },
    {
      src: 'https://fonts.gstatic.com/s/notosanssc/v37/k3kCo84MPvpLmixcA63oeAL7Iqp5IZJF9bmaG9_EnYxNbPCJo-qIPOvA.ttf',
      fontWeight: 'bold',
    },
  ],
});

// Disable hyphenation for Chinese text
Font.registerHyphenationCallback((word) => [word]);

// ---- Experience type labels ----

const EXP_TYPE_LABELS: Record<string, string> = {
  internship: '实习经历',
  project: '项目经历',
  research: '科研经历',
  competition: '竞赛经历',
};

// ---- Styles ----

const styles = StyleSheet.create({
  page: {
    fontFamily: 'NotoSansSC',
    paddingTop: 32,
    paddingBottom: 32,
    paddingHorizontal: 40,
    fontSize: 10,
    lineHeight: 1.5,
    color: '#1a1a1a',
  },

  // ---- Header ----
  headerName: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
    color: '#111827',
  },
  headerContact: {
    fontSize: 9,
    textAlign: 'center',
    color: '#4b5563',
    marginBottom: 16,
  },

  // ---- Section ----
  section: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#111827',
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
    paddingBottom: 3,
    marginBottom: 6,
  },

  // ---- Education ----
  eduRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 2,
  },
  eduSchool: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  eduDate: {
    fontSize: 9,
    color: '#6b7280',
  },
  eduDetail: {
    fontSize: 9,
    color: '#374151',
    marginBottom: 4,
  },

  // ---- Experience ----
  expGroup: {
    marginBottom: 8,
  },
  expGroupTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 4,
  },
  expItem: {
    marginBottom: 6,
  },
  expHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 2,
  },
  expCompany: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  expDuration: {
    fontSize: 9,
    color: '#6b7280',
  },
  expRole: {
    fontSize: 9,
    color: '#4b5563',
    marginBottom: 2,
  },
  expBullet: {
    fontSize: 9,
    color: '#374151',
    paddingLeft: 8,
    marginBottom: 1,
  },
  expSkills: {
    fontSize: 8,
    color: '#6b7280',
    marginTop: 2,
  },

  // ---- Skills ----
  skillsText: {
    fontSize: 9,
    color: '#374151',
    lineHeight: 1.6,
  },

  // ---- Awards ----
  awardItem: {
    fontSize: 9,
    color: '#374151',
    marginBottom: 2,
  },
});

// ---- Component ----

interface ResumePDFTemplateProps {
  data: ParsedResume;
}

export function ResumePDFTemplate({ data }: ResumePDFTemplateProps) {
  const { basic_info, experiences, skills, awards, certifications } = data;

  // Group experiences by type
  const groupedExperiences = experiences.reduce(
    (acc, exp) => {
      const type = exp.type || 'project';
      if (!acc[type]) acc[type] = [];
      acc[type].push(exp);
      return acc;
    },
    {} as Record<string, typeof experiences>
  );

  // Order: research, internship, project, competition
  const typeOrder = ['research', 'internship', 'project', 'competition'];
  const orderedTypes = typeOrder.filter((t) => groupedExperiences[t]);

  // Contact info
  const contactParts: string[] = [];
  if (basic_info.phone) contactParts.push(basic_info.phone);
  if (basic_info.email) contactParts.push(basic_info.email);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        {basic_info.name && (
          <Text style={styles.headerName}>{basic_info.name}</Text>
        )}
        {contactParts.length > 0 && (
          <Text style={styles.headerContact}>
            {contactParts.join('  |  ')}
          </Text>
        )}

        {/* Education */}
        {basic_info.education.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>教育背景</Text>
            {basic_info.education.map((edu, i) => (
              <View key={i}>
                <View style={styles.eduRow}>
                  <Text style={styles.eduSchool}>{edu.school}</Text>
                  <Text style={styles.eduDate}>
                    {edu.start_date}
                    {edu.end_date ? ` - ${edu.end_date}` : ''}
                  </Text>
                </View>
                <Text style={styles.eduDetail}>
                  {[edu.degree, edu.major, edu.gpa ? `GPA: ${edu.gpa}` : '']
                    .filter(Boolean)
                    .join('  |  ')}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Experiences (grouped by type) */}
        {orderedTypes.map((type) => (
          <View key={type} style={styles.section}>
            <Text style={styles.sectionTitle}>
              {EXP_TYPE_LABELS[type] || type}
            </Text>
            {groupedExperiences[type].map((exp) => (
              <View key={exp.id} style={styles.expItem}>
                <View style={styles.expHeader}>
                  <Text style={styles.expCompany}>
                    {exp.company_or_org}
                  </Text>
                  <Text style={styles.expDuration}>{exp.duration}</Text>
                </View>
                {exp.role && (
                  <Text style={styles.expRole}>{exp.role}</Text>
                )}
                {exp.descriptions.map((desc, j) => (
                  <Text key={j} style={styles.expBullet}>
                    {'- '}{desc}
                  </Text>
                ))}
                {exp.metrics.length > 0 && (
                  <Text style={styles.expBullet}>
                    {'- '}
                    {exp.metrics.join('；')}
                  </Text>
                )}
                {exp.skills_involved.length > 0 && (
                  <Text style={styles.expSkills}>
                    技术栈: {exp.skills_involved.join(', ')}
                  </Text>
                )}
              </View>
            ))}
          </View>
        ))}

        {/* Skills */}
        {skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>专业技能</Text>
            <Text style={styles.skillsText}>{skills.join('、')}</Text>
          </View>
        )}

        {/* Awards */}
        {awards.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>荣誉奖项</Text>
            {awards.map((award, i) => (
              <Text key={i} style={styles.awardItem}>
                {'- '}{award}
              </Text>
            ))}
          </View>
        )}

        {/* Certifications */}
        {certifications.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>证书资质</Text>
            {certifications.map((cert, i) => (
              <Text key={i} style={styles.awardItem}>
                {'- '}{cert}
              </Text>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
}
