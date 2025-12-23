"""
Unit tests for Impact Rules Module

Tests rule-based property division impact calculations
without LLM dependency.
"""

import pytest
from src.analysis.impact_rules import (
    FaultType,
    EvidenceType,
    ImpactDirection,
    ImpactRule,
    IMPACT_RULES,
    calculate_fault_impact,
    get_rule_for_fault,
    get_evidence_weight,
    apply_evidence_multiplier,
)


class TestFaultTypeEnum:
    """Test FaultType enumeration"""

    def test_fault_type_values(self):
        """Given: FaultType enum
        When: Accessing enum values
        Then: All fault types are defined"""
        assert FaultType.ADULTERY.value == "adultery"
        assert FaultType.VIOLENCE.value == "violence"
        assert FaultType.VERBAL_ABUSE.value == "verbal_abuse"
        assert FaultType.ECONOMIC_ABUSE.value == "economic_abuse"
        assert FaultType.DESERTION.value == "desertion"
        assert FaultType.FINANCIAL_MISCONDUCT.value == "financial_misconduct"
        assert FaultType.CHILD_ABUSE.value == "child_abuse"
        assert FaultType.SUBSTANCE_ABUSE.value == "substance_abuse"

    def test_fault_type_completeness(self):
        """Given: FaultType enum
        When: Checking all members
        Then: All Article 840 grounds covered"""
        fault_types = list(FaultType)
        assert len(fault_types) >= 8


class TestEvidenceTypeEnum:
    """Test EvidenceType enumeration"""

    def test_evidence_type_values(self):
        """Given: EvidenceType enum
        When: Accessing enum values
        Then: All evidence types are defined"""
        assert EvidenceType.PHOTO.value == "photo"
        assert EvidenceType.CHAT_LOG.value == "chat_log"
        assert EvidenceType.RECORDING.value == "recording"
        assert EvidenceType.VIDEO.value == "video"
        assert EvidenceType.MEDICAL_RECORD.value == "medical_record"
        assert EvidenceType.POLICE_REPORT.value == "police_report"
        assert EvidenceType.BANK_STATEMENT.value == "bank_statement"
        assert EvidenceType.DOCUMENT.value == "document"
        assert EvidenceType.WITNESS.value == "witness"


class TestImpactDirection:
    """Test ImpactDirection enumeration"""

    def test_impact_direction_values(self):
        """Given: ImpactDirection enum
        When: Accessing enum values
        Then: All directions are defined"""
        assert ImpactDirection.PLAINTIFF_FAVOR.value == "plaintiff_favor"
        assert ImpactDirection.DEFENDANT_FAVOR.value == "defendant_favor"
        assert ImpactDirection.NEUTRAL.value == "neutral"


class TestImpactRule:
    """Test ImpactRule dataclass"""

    def test_impact_rule_creation(self):
        """Given: ImpactRule parameters
        When: Creating ImpactRule instance
        Then: All fields are set correctly"""
        rule = ImpactRule(
            base_impact=5.0,
            max_impact=10.0,
            evidence_weights={"photo": 1.5, "video": 1.8},
            description="Test rule"
        )
        assert rule.base_impact == 5.0
        assert rule.max_impact == 10.0
        assert rule.evidence_weights["photo"] == 1.5
        assert rule.description == "Test rule"


class TestImpactRulesTable:
    """Test IMPACT_RULES configuration table"""

    def test_all_fault_types_have_rules(self):
        """Given: IMPACT_RULES table
        When: Checking all fault types
        Then: Every fault type has a rule"""
        for fault_type in FaultType:
            assert fault_type in IMPACT_RULES, f"Missing rule for {fault_type}"

    def test_adultery_rule(self):
        """Given: Adultery fault type
        When: Retrieving rule
        Then: Rule has correct parameters"""
        rule = IMPACT_RULES[FaultType.ADULTERY]
        assert rule.base_impact == 5.0
        assert rule.max_impact == 10.0
        assert EvidenceType.PHOTO.value in rule.evidence_weights
        assert EvidenceType.VIDEO.value in rule.evidence_weights
        assert rule.evidence_weights[EvidenceType.PHOTO.value] == 1.5
        assert rule.evidence_weights[EvidenceType.VIDEO.value] == 1.8

    def test_violence_rule(self):
        """Given: Violence fault type
        When: Retrieving rule
        Then: Rule emphasizes medical/police evidence"""
        rule = IMPACT_RULES[FaultType.VIOLENCE]
        assert rule.base_impact == 4.0
        assert rule.max_impact == 8.0
        assert rule.evidence_weights[EvidenceType.MEDICAL_RECORD.value] == 2.0
        assert rule.evidence_weights[EvidenceType.POLICE_REPORT.value] == 2.0

    def test_verbal_abuse_rule(self):
        """Given: Verbal abuse fault type
        When: Retrieving rule
        Then: Rule has lower impact than violence"""
        rule = IMPACT_RULES[FaultType.VERBAL_ABUSE]
        assert rule.base_impact == 2.0
        assert rule.max_impact == 5.0
        assert rule.max_impact < IMPACT_RULES[FaultType.VIOLENCE].max_impact

    def test_economic_abuse_rule(self):
        """Given: Economic abuse fault type
        When: Retrieving rule
        Then: Rule emphasizes financial evidence"""
        rule = IMPACT_RULES[FaultType.ECONOMIC_ABUSE]
        assert EvidenceType.BANK_STATEMENT.value in rule.evidence_weights
        assert rule.evidence_weights[EvidenceType.BANK_STATEMENT.value] > 1.0

    def test_rule_base_impact_positive(self):
        """Given: All fault type rules
        When: Checking base_impact
        Then: All values are positive"""
        for fault_type, rule in IMPACT_RULES.items():
            assert rule.base_impact > 0, f"{fault_type} has non-positive base_impact"

    def test_rule_max_impact_greater_than_base(self):
        """Given: All fault type rules
        When: Comparing max_impact to base_impact
        Then: max_impact >= base_impact"""
        for fault_type, rule in IMPACT_RULES.items():
            assert rule.max_impact >= rule.base_impact, \
                f"{fault_type} max_impact < base_impact"

    def test_evidence_weights_positive(self):
        """Given: All fault type rules
        When: Checking evidence weights
        Then: All weights are positive"""
        for fault_type, rule in IMPACT_RULES.items():
            for evidence_type, weight in rule.evidence_weights.items():
                assert weight > 0, \
                    f"{fault_type} has non-positive weight for {evidence_type}"


class TestGetRuleForFault:
    """Test get_rule_for_fault function"""

    def test_get_rule_adultery(self):
        """Given: Adultery fault type
        When: Getting rule
        Then: Returns correct rule"""
        rule = get_rule_for_fault(FaultType.ADULTERY)
        assert rule.base_impact == 5.0
        assert rule.max_impact == 10.0

    def test_get_rule_violence(self):
        """Given: Violence fault type
        When: Getting rule
        Then: Returns correct rule"""
        rule = get_rule_for_fault(FaultType.VIOLENCE)
        assert rule.base_impact == 4.0
        assert rule.max_impact == 8.0

    def test_get_rule_invalid_fault_type(self):
        """Given: Invalid fault type
        When: Getting rule
        Then: Raises KeyError"""
        with pytest.raises(KeyError):
            get_rule_for_fault("invalid_fault")


class TestGetEvidenceWeight:
    """Test get_evidence_weight function"""

    def test_get_weight_photo_for_adultery(self):
        """Given: Photo evidence for adultery
        When: Getting weight
        Then: Returns 1.5"""
        weight = get_evidence_weight(FaultType.ADULTERY, EvidenceType.PHOTO)
        assert weight == 1.5

    def test_get_weight_medical_record_for_violence(self):
        """Given: Medical record for violence
        When: Getting weight
        Then: Returns 2.0 (high weight)"""
        weight = get_evidence_weight(FaultType.VIOLENCE, EvidenceType.MEDICAL_RECORD)
        assert weight == 2.0

    def test_get_weight_unsupported_evidence(self):
        """Given: Evidence type not in rule
        When: Getting weight
        Then: Returns 1.0 (neutral weight)"""
        weight = get_evidence_weight(FaultType.ADULTERY, EvidenceType.DOCUMENT)
        assert weight == 1.0

    def test_get_weight_bank_statement_for_economic_abuse(self):
        """Given: Bank statement for economic abuse
        When: Getting weight
        Then: Returns high weight"""
        weight = get_evidence_weight(FaultType.ECONOMIC_ABUSE, EvidenceType.BANK_STATEMENT)
        assert weight > 1.0


class TestApplyEvidenceMultiplier:
    """Test apply_evidence_multiplier function"""

    def test_apply_multiplier_no_evidence(self):
        """Given: Base impact with no evidence
        When: Applying multiplier
        Then: Returns base impact unchanged"""
        result = apply_evidence_multiplier(5.0, 10.0, [])
        assert result == 5.0

    def test_apply_multiplier_single_evidence(self):
        """Given: Base impact with one evidence (weight 1.5)
        When: Applying multiplier
        Then: Impact increases proportionally"""
        base = 5.0
        max_impact = 10.0
        evidence_weights = [1.5]
        result = apply_evidence_multiplier(base, max_impact, evidence_weights)
        assert result > base
        assert result <= max_impact

    def test_apply_multiplier_multiple_evidence(self):
        """Given: Base impact with multiple evidence
        When: Applying multiplier
        Then: Impact increases with cumulative weight"""
        base = 5.0
        max_impact = 10.0
        evidence_weights = [1.5, 1.2, 1.3]
        result = apply_evidence_multiplier(base, max_impact, evidence_weights)
        assert result > base
        assert result <= max_impact

    def test_apply_multiplier_caps_at_max(self):
        """Given: Very high evidence weights
        When: Applying multiplier
        Then: Result capped at max_impact"""
        base = 5.0
        max_impact = 10.0
        evidence_weights = [2.0, 2.0, 2.0, 2.0, 2.0]  # Extremely high
        result = apply_evidence_multiplier(base, max_impact, evidence_weights)
        assert result == max_impact

    def test_apply_multiplier_low_weights(self):
        """Given: Low evidence weights
        When: Applying multiplier
        Then: Impact increases slightly"""
        base = 5.0
        max_impact = 10.0
        evidence_weights = [1.0, 1.0]  # Neutral weights
        result = apply_evidence_multiplier(base, max_impact, evidence_weights)
        assert result >= base
        assert result < max_impact


class TestCalculateFaultImpact:
    """Test calculate_fault_impact function"""

    def test_calculate_adultery_no_evidence(self):
        """Given: Adultery with no evidence
        When: Calculating impact
        Then: Returns base impact"""
        impact = calculate_fault_impact(FaultType.ADULTERY, [])
        assert impact == 5.0

    def test_calculate_adultery_with_photo(self):
        """Given: Adultery with photo evidence
        When: Calculating impact
        Then: Impact > base"""
        impact = calculate_fault_impact(FaultType.ADULTERY, [EvidenceType.PHOTO])
        assert impact > 5.0
        assert impact <= 10.0

    def test_calculate_adultery_with_multiple_evidence(self):
        """Given: Adultery with photo + video
        When: Calculating impact
        Then: Impact higher than single evidence"""
        impact_single = calculate_fault_impact(FaultType.ADULTERY, [EvidenceType.PHOTO])
        impact_multiple = calculate_fault_impact(
            FaultType.ADULTERY,
            [EvidenceType.PHOTO, EvidenceType.VIDEO]
        )
        assert impact_multiple > impact_single
        assert impact_multiple <= 10.0

    def test_calculate_violence_with_medical_record(self):
        """Given: Violence with medical record
        When: Calculating impact
        Then: High impact due to strong evidence"""
        impact = calculate_fault_impact(FaultType.VIOLENCE, [EvidenceType.MEDICAL_RECORD])
        assert impact > 4.0  # Greater than base
        assert impact <= 8.0

    def test_calculate_violence_with_police_report(self):
        """Given: Violence with police report
        When: Calculating impact
        Then: High impact due to official evidence"""
        impact = calculate_fault_impact(FaultType.VIOLENCE, [EvidenceType.POLICE_REPORT])
        assert impact > 4.0
        assert impact <= 8.0

    def test_calculate_verbal_abuse_lower_impact(self):
        """Given: Verbal abuse with recording
        When: Calculating impact
        Then: Lower impact than violence"""
        impact_verbal = calculate_fault_impact(FaultType.VERBAL_ABUSE, [EvidenceType.RECORDING])
        impact_violence = calculate_fault_impact(FaultType.VIOLENCE, [EvidenceType.RECORDING])
        assert impact_verbal < impact_violence

    def test_calculate_economic_abuse_with_bank_statement(self):
        """Given: Economic abuse with bank statement
        When: Calculating impact
        Then: Impact reflects financial evidence"""
        impact = calculate_fault_impact(FaultType.ECONOMIC_ABUSE, [EvidenceType.BANK_STATEMENT])
        base = IMPACT_RULES[FaultType.ECONOMIC_ABUSE].base_impact
        assert impact >= base

    def test_calculate_child_abuse_severity(self):
        """Given: Child abuse fault
        When: Calculating impact
        Then: Impact reflects severity"""
        impact = calculate_fault_impact(FaultType.CHILD_ABUSE, [EvidenceType.MEDICAL_RECORD])
        assert impact > 0

    def test_calculate_impact_never_exceeds_max(self):
        """Given: Any fault type with excessive evidence
        When: Calculating impact
        Then: Impact never exceeds max_impact"""
        for fault_type in FaultType:
            all_evidence = list(EvidenceType)
            impact = calculate_fault_impact(fault_type, all_evidence)
            max_impact = IMPACT_RULES[fault_type].max_impact
            assert impact <= max_impact, f"{fault_type} exceeded max_impact"

    def test_calculate_impact_percentage_points(self):
        """Given: Any fault impact
        When: Calculating impact
        Then: Result is in percentage points (typically 0-15)"""
        for fault_type in FaultType:
            impact = calculate_fault_impact(fault_type, [])
            assert 0 <= impact <= 15, f"{fault_type} impact out of expected range"


class TestEdgeCases:
    """Test edge cases and boundary conditions"""

    def test_empty_evidence_list(self):
        """Given: Empty evidence list
        When: Calculating impact
        Then: Returns base impact"""
        for fault_type in FaultType:
            impact = calculate_fault_impact(fault_type, [])
            assert impact == IMPACT_RULES[fault_type].base_impact

    def test_duplicate_evidence_types(self):
        """Given: Duplicate evidence types
        When: Calculating impact
        Then: Each instance counted separately"""
        impact_single = calculate_fault_impact(FaultType.ADULTERY, [EvidenceType.PHOTO])
        impact_double = calculate_fault_impact(
            FaultType.ADULTERY,
            [EvidenceType.PHOTO, EvidenceType.PHOTO]
        )
        assert impact_double >= impact_single

    def test_unsupported_evidence_type_for_fault(self):
        """Given: Evidence type not in rule's weights
        When: Calculating impact
        Then: Uses neutral weight (1.0)"""
        # Document evidence not specifically weighted for adultery
        impact = calculate_fault_impact(FaultType.ADULTERY, [EvidenceType.DOCUMENT])
        assert impact >= IMPACT_RULES[FaultType.ADULTERY].base_impact

    def test_all_evidence_types_together(self):
        """Given: All evidence types for a fault
        When: Calculating impact
        Then: Hits max_impact"""
        all_evidence = list(EvidenceType)
        for fault_type in FaultType:
            impact = calculate_fault_impact(fault_type, all_evidence)
            max_impact = IMPACT_RULES[fault_type].max_impact
            assert impact == max_impact


class TestPropertyDivisionScenarios:
    """Test realistic property division scenarios"""

    def test_scenario_adultery_with_photos_and_messages(self):
        """Given: Adultery case with photos and chat logs
        When: Calculating impact
        Then: Significant impact (60:40 split expected)"""
        evidence = [EvidenceType.PHOTO, EvidenceType.CHAT_LOG, EvidenceType.CHAT_LOG]
        impact = calculate_fault_impact(FaultType.ADULTERY, evidence)
        # Expected: ~7-10% impact → 57:43 to 60:40 split
        assert 7.0 <= impact <= 10.0

    def test_scenario_violence_with_medical_and_police(self):
        """Given: Violence case with medical record and police report
        When: Calculating impact
        Then: High impact (65:35 split expected)"""
        evidence = [EvidenceType.MEDICAL_RECORD, EvidenceType.POLICE_REPORT, EvidenceType.PHOTO]
        impact = calculate_fault_impact(FaultType.VIOLENCE, evidence)
        # Expected: max impact due to strong evidence
        assert impact == IMPACT_RULES[FaultType.VIOLENCE].max_impact

    def test_scenario_economic_abuse_with_bank_records(self):
        """Given: Economic abuse with bank statements
        When: Calculating impact
        Then: Moderate impact based on financial evidence"""
        evidence = [EvidenceType.BANK_STATEMENT, EvidenceType.BANK_STATEMENT, EvidenceType.DOCUMENT]
        impact = calculate_fault_impact(FaultType.ECONOMIC_ABUSE, evidence)
        base = IMPACT_RULES[FaultType.ECONOMIC_ABUSE].base_impact
        assert impact > base

    def test_scenario_mixed_faults_adultery_and_violence(self):
        """Given: Multiple faults (adultery + violence)
        When: Calculating separate impacts
        Then: Impacts should be additive in practice"""
        adultery_impact = calculate_fault_impact(FaultType.ADULTERY, [EvidenceType.PHOTO])
        violence_impact = calculate_fault_impact(FaultType.VIOLENCE, [EvidenceType.MEDICAL_RECORD])
        # In real system, these would be summed (capped at reasonable limit like 20%p)
        total_estimated = adultery_impact + violence_impact
        assert total_estimated > 10.0  # Significant combined impact

    def test_scenario_weak_evidence_verbal_abuse(self):
        """Given: Verbal abuse with weak evidence
        When: Calculating impact
        Then: Minimal impact"""
        evidence = [EvidenceType.WITNESS]  # Only witness statement
        impact = calculate_fault_impact(FaultType.VERBAL_ABUSE, evidence)
        assert impact <= 3.0  # Low impact


class TestRuleConsistency:
    """Test consistency across all rules"""

    def test_all_rules_have_descriptions(self):
        """Given: All fault type rules
        When: Checking descriptions
        Then: All have non-empty descriptions"""
        for fault_type, rule in IMPACT_RULES.items():
            assert rule.description, f"{fault_type} missing description"
            assert len(rule.description) > 10

    def test_rules_sorted_by_severity(self):
        """Given: All fault type rules
        When: Comparing max_impacts
        Then: More severe faults have higher max_impact"""
        # Adultery and violence should have highest max_impact
        assert IMPACT_RULES[FaultType.ADULTERY].max_impact >= 10.0
        assert IMPACT_RULES[FaultType.VIOLENCE].max_impact >= 8.0
        # Verbal abuse should be lower
        assert IMPACT_RULES[FaultType.VERBAL_ABUSE].max_impact <= 5.0

    def test_evidence_weights_reasonable_range(self):
        """Given: All evidence weights
        When: Checking weight values
        Then: All weights in range [0.5, 2.5]"""
        for fault_type, rule in IMPACT_RULES.items():
            for evidence_type, weight in rule.evidence_weights.items():
                assert 0.5 <= weight <= 2.5, \
                    f"{fault_type}/{evidence_type} weight {weight} out of range"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])